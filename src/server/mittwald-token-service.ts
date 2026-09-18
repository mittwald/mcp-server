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

/**
 * Why a refresh attempt failed.
 *
 * - `revoked`: Mittwald rejected the refresh token itself. Re-authentication is the only way
 *   forward, so the session can be discarded.
 * - `configuration`: this server is misconfigured (missing token URL or client ID). Nothing is
 *   wrong with the user's session — discarding it would punish the user for an operator mistake.
 * - `transport`: network failure, malformed response or a 5xx from Mittwald. Transient; the next
 *   attempt may well succeed.
 */
export type MittwaldTokenFailureReason = 'revoked' | 'configuration' | 'transport';

export class MittwaldTokenServiceError extends Error {
  readonly reason: MittwaldTokenFailureReason;

  constructor(message: string, reason: MittwaldTokenFailureReason = 'transport') {
    super(message);
    this.name = 'MittwaldTokenServiceError';
    this.reason = reason;
  }
}

function readOAuthErrorCode(payload: unknown): string | undefined {
  if (!payload || typeof payload !== 'object') {
    return undefined;
  }

  const error = (payload as Record<string, unknown>).error;
  return typeof error === 'string' ? error : undefined;
}

export async function refreshMittwaldAccessToken(
  params: MittwaldTokenRefreshParams
): Promise<MittwaldTokenResponse> {
  const {
    TOKEN_URL: tokenUrl,
    CLIENT_ID: clientId,
  } = CONFIG.MITTWALD;

  if (!tokenUrl || !clientId) {
    throw new MittwaldTokenServiceError(
      `Mittwald OAuth configuration is incomplete (${!tokenUrl ? 'MITTWALD_TOKEN_URL' : 'MITTWALD_CLIENT_ID'} is not set)`,
      'configuration'
    );
  }

  const body = new URLSearchParams();
  body.set('grant_type', 'refresh_token');
  body.set('refresh_token', params.refreshToken);
  body.set('client_id', clientId);
  if (params.scope) {
    body.set('scope', params.scope);
  }

  let response: Response;
  try {
    response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
      body,
    });
  } catch (error) {
    logger.warn({ error }, 'Mittwald token refresh: request failed');
    throw new MittwaldTokenServiceError('Could not reach the Mittwald token endpoint', 'transport');
  }

  const text = await response.text();
  let payload: unknown;

  try {
    payload = JSON.parse(text);
  } catch (error) {
    logger.error({ error, text }, 'Mittwald token refresh: failed to parse response');
    throw new MittwaldTokenServiceError('Failed to parse Mittwald token response', 'transport');
  }

  if (!response.ok) {
    logger.warn({ payload, status: response.status }, 'Mittwald token refresh failed');

    // Only `invalid_grant` means the refresh token is genuinely dead. Everything else — a 5xx, a
    // rate limit, or an `invalid_client` caused by our own credentials — is not the user's fault
    // and must not cost them their session.
    const reason: MittwaldTokenFailureReason =
      readOAuthErrorCode(payload) === 'invalid_grant' ? 'revoked' : 'transport';

    throw new MittwaldTokenServiceError('Mittwald token refresh failed', reason);
  }

  if (!payload || typeof payload !== 'object' || !('access_token' in payload)) {
    logger.error({ payload }, 'Mittwald token refresh missing access_token');
    throw new MittwaldTokenServiceError('Mittwald token refresh missing access_token', 'transport');
  }

  return payload as MittwaldTokenResponse;
}
