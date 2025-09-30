import { CONFIG } from './config.js';
import { logger } from '../utils/logger.js';

export interface MittwaldTokenRefreshParams {
  refreshToken: string;
  scope?: string;
}

export interface MittwaldTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
  [key: string]: unknown;
}

export class MittwaldTokenServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MittwaldTokenServiceError';
  }
}

export async function refreshMittwaldAccessToken(
  params: MittwaldTokenRefreshParams
): Promise<MittwaldTokenResponse> {
  const {
    TOKEN_URL: tokenUrl,
    CLIENT_ID: clientId,
  } = CONFIG.MITTWALD;

  if (!tokenUrl || !clientId) {
    throw new MittwaldTokenServiceError('Mittwald OAuth configuration is incomplete');
  }

  const body = new URLSearchParams();
  body.set('grant_type', 'refresh_token');
  body.set('refresh_token', params.refreshToken);
  body.set('client_id', clientId);
  if (params.scope) {
    body.set('scope', params.scope);
  }

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  const text = await response.text();
  let payload: unknown;

  try {
    payload = JSON.parse(text);
  } catch (error) {
    logger.error({ error, text }, 'Mittwald token refresh: failed to parse response');
    throw new MittwaldTokenServiceError('Failed to parse Mittwald token response');
  }

  if (!response.ok) {
    logger.warn({ payload, status: response.status }, 'Mittwald token refresh failed');
    throw new MittwaldTokenServiceError('Mittwald token refresh failed');
  }

  if (!payload || typeof payload !== 'object' || !('access_token' in payload)) {
    logger.error({ payload }, 'Mittwald token refresh missing access_token');
    throw new MittwaldTokenServiceError('Mittwald token refresh missing access_token');
  }

  return payload as MittwaldTokenResponse;
}
