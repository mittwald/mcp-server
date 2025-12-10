import type { BridgeConfig } from '../config.js';
import type { MittwaldTokenResponse } from '../state/state-store.js';
import type pino from 'pino';

interface ExchangeMittwaldAuthorizationCodeArgs {
  config: BridgeConfig;
  authorizationCode: string;
  codeVerifier: string;
  logger: pino.Logger;
}

interface RefreshMittwaldTokensArgs {
  config: BridgeConfig;
  refreshToken: string;
  logger: pino.Logger;
}

export async function exchangeMittwaldAuthorizationCode({
  config,
  authorizationCode,
  codeVerifier,
  logger
}: ExchangeMittwaldAuthorizationCodeArgs): Promise<MittwaldTokenResponse> {
  const body = new URLSearchParams();
  body.set('grant_type', 'authorization_code');
  body.set('code', authorizationCode);
  body.set('redirect_uri', `${config.bridge.baseUrl}/mittwald/callback`);
  body.set('client_id', config.mittwald.clientId);
  body.set('code_verifier', codeVerifier);

  const response = await fetch(config.mittwald.tokenUrl, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded'
    },
    body
  });

  const text = await response.text();

  // [TOKEN-DEBUG] Log RAW response from Mittwald
  console.error(`[TOKEN-DEBUG] mittwald_api_response_length: ${text.length}`);
  console.error(`[TOKEN-DEBUG] mittwald_api_response_preview: ${text.substring(0, 200)}`);

  let payload: MittwaldTokenResponse | { error: string; error_description?: string };

  try {
    payload = JSON.parse(text);
  } catch (error) {
    logger.error({ error, text }, 'Failed to parse Mittwald token response');
    throw new Error('Failed to parse Mittwald token response');
  }

  // [TOKEN-DEBUG] Log parsed payload access_token field
  if ('access_token' in payload) {
    console.error(`[TOKEN-DEBUG] parsed_access_token_length: ${payload.access_token.length}`);
    console.error(`[TOKEN-DEBUG] parsed_access_token_value: ${payload.access_token}`);
  }

  if (!response.ok) {
    logger.warn({ payload }, 'Mittwald token endpoint returned an error');
    throw new Error('Mittwald token exchange failed');
  }

  if (!('access_token' in payload)) {
    logger.error({ payload }, 'Mittwald token response missing access_token');
    throw new Error('Mittwald token response missing access_token');
  }

  // [TOKEN-DEBUG] T001: Instrument OAuth Bridge Token Generation
  const token = payload.access_token;
  const parts = token.split(':');
  console.error(`[TOKEN-DEBUG] oauth_bridge_generation: length=${token.length}, parts=${parts.length}, suffix_len=${parts[2]?.length || 0}`);
  const redactedFormat = parts.length === 3
    ? `${parts[0]?.slice(0, 8)}...:[REDACTED]:${parts[2]}`
    : '[MALFORMED]';
  console.error(`[TOKEN-DEBUG] oauth_bridge format: ${redactedFormat}`);

  return payload;
}

export async function refreshMittwaldTokens({
  config,
  refreshToken,
  logger
}: RefreshMittwaldTokensArgs): Promise<MittwaldTokenResponse> {
  const body = new URLSearchParams();
  body.set('grant_type', 'refresh_token');
  body.set('refresh_token', refreshToken);
  body.set('client_id', config.mittwald.clientId);

  const response = await fetch(config.mittwald.tokenUrl, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded'
    },
    body
  });

  const text = await response.text();
  let payload: MittwaldTokenResponse | { error: string; error_description?: string };

  try {
    payload = JSON.parse(text);
  } catch (error) {
    logger.error({ error, text }, 'Failed to parse Mittwald refresh token response');
    throw new Error('Failed to parse Mittwald refresh token response');
  }

  if (!response.ok) {
    logger.warn({ payload }, 'Mittwald refresh token endpoint returned an error');
    throw new Error('Mittwald refresh token exchange failed');
  }

  if (!('access_token' in payload)) {
    logger.error({ payload }, 'Mittwald refresh token response missing access_token');
    throw new Error('Mittwald refresh token response missing access_token');
  }

  // [TOKEN-DEBUG] T001: Instrument OAuth Bridge Token Refresh
  const token = payload.access_token;
  const parts = token.split(':');
  console.error(`[TOKEN-DEBUG] oauth_bridge_refresh: length=${token.length}, parts=${parts.length}, suffix_len=${parts[2]?.length || 0}`);
  const redactedFormat = parts.length === 3
    ? `${parts[0]?.slice(0, 8)}...:[REDACTED]:${parts[2]}`
    : '[MALFORMED]';
  console.error(`[TOKEN-DEBUG] oauth_bridge_refresh format: ${redactedFormat}`);

  return payload;
}
