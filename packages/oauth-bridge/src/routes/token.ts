import Router from '@koa/router';
import { createHash } from 'node:crypto';
import type { BridgeConfig } from '../config.js';
import type { ClientRegistrationRecord, StateStore, AuthorizationGrantRecord } from '../state/state-store.js';
import { exchangeMittwaldAuthorizationCode, refreshMittwaldTokens } from '../services/mittwald.js';
import { issueBridgeTokens } from '../services/bridge-tokens.js';
import { tokenRequests } from '../metrics/index.js';

interface TokenRouterDeps {
  config: BridgeConfig;
  stateStore: StateStore;
}

export function createTokenRouter({ config, stateStore }: TokenRouterDeps) {
  const router = new Router();

  router.post('/token', async (ctx) => {
    const body = ctx.request.body as Record<string, string | undefined>;

    const grantType = body['grant_type'];
    const clientId = body['client_id'];
    const clientSecretFromBody = body['client_secret'];

    ctx.logger.debug({
      grantType,
      clientId,
      hasRefreshToken: !!body['refresh_token'],
      hasCode: !!body['code']
    }, 'Incoming token exchange request');

    // Validate grant type
    if (grantType !== 'authorization_code' && grantType !== 'refresh_token') {
      ctx.logger.warn({ grantType, clientId }, 'Unsupported grant type');
      tokenRequests.inc({ grant_type: grantType || 'unknown', status: 'error' });
      ctx.status = 400;
      ctx.body = { error: 'unsupported_grant_type', error_description: 'Only authorization_code and refresh_token are supported' };
      return;
    }

    // Load client registration (common to both flows)
    let clientRegistration;
    try {
      clientRegistration = await stateStore.getClientRegistration(clientId!);
    } catch (err) {
      ctx.logger.error({ error: err instanceof Error ? err.message : String(err), clientId }, 'Failed to load client registration');
      tokenRequests.inc({ grant_type: grantType, status: 'error' });
      ctx.status = 500;
      ctx.body = { error: 'server_error', error_description: 'Failed to load client registration' };
      return;
    }

    if (!clientRegistration) {
      ctx.logger.warn({ clientId }, 'Token request for unknown client');
      tokenRequests.inc({ grant_type: grantType, status: 'error' });
      ctx.status = 401;
      ctx.set('WWW-Authenticate', 'Basic realm="OAuth Bridge"');
      ctx.body = { error: 'invalid_client', error_description: 'Client not registered' };
      return;
    }

    // Validate client credentials (common to both flows)
    const clientAuthError = validateClientCredentials({
      registration: clientRegistration,
      authorizationHeader: ctx.request.headers.authorization,
      clientId: clientId!,
      clientSecretFromBody
    });
    if (clientAuthError) {
      ctx.logger.warn({ clientId, reason: clientAuthError.body.error_description }, 'Token client authentication failed');
      tokenRequests.inc({ grant_type: grantType, status: 'error' });
      ctx.status = clientAuthError.status;
      if (clientAuthError.wwwAuthenticate) {
        ctx.set('WWW-Authenticate', clientAuthError.wwwAuthenticate);
      }
      ctx.body = clientAuthError.body;
      return;
    }

    // Branch based on grant type
    if (grantType === 'refresh_token') {
      await handleRefreshTokenGrant(ctx, { config, stateStore, clientId: clientId!, body });
    } else {
      await handleAuthorizationCodeGrant(ctx, { config, stateStore, clientId: clientId!, body });
    }
  });

  return router;
}

interface GrantHandlerDeps {
  config: BridgeConfig;
  stateStore: StateStore;
  clientId: string;
  body: Record<string, string | undefined>;
}

async function handleAuthorizationCodeGrant(
  ctx: Router.RouterContext,
  { config, stateStore, clientId, body }: GrantHandlerDeps
) {
  const code = body['code'];
  const redirectUri = body['redirect_uri'];
  const codeVerifier = body['code_verifier'];

  const validationError = validateAuthorizationCodeRequest({ code, redirectUri, clientId, codeVerifier });
  if (validationError) {
    ctx.logger.warn({ error: validationError.body.error, description: validationError.body.error_description, clientId }, 'Token request validation failed');
    tokenRequests.inc({ grant_type: 'authorization_code', status: 'error' });
    ctx.status = validationError.status;
    ctx.body = validationError.body;
    return;
  }

  let grant;
  try {
    grant = await stateStore.getAuthorizationGrant(code!);

    if (grant) {
      ctx.logger.debug({
        authCode: code ? `${code.substring(0, 8)}...` : undefined,
        grantClientId: grant.clientId,
        grantRedirectUri: grant.redirectUri,
        requestRedirectUri: redirectUri,
        used: grant.used
      }, 'Authorization grant retrieved');
    } else {
      ctx.logger.warn({
        authCode: code ? `${code.substring(0, 8)}...` : undefined,
        clientId
      }, 'Authorization grant not found');
    }
  } catch (err) {
    ctx.logger.error({ error: err instanceof Error ? err.message : String(err), clientId }, 'Failed to read authorization grant');
    tokenRequests.inc({ grant_type: 'authorization_code', status: 'error' });
    ctx.status = 500;
    ctx.body = { error: 'server_error', error_description: 'Failed to read authorization grant' };
    return;
  }

  if (!grant) {
    tokenRequests.inc({ grant_type: 'authorization_code', status: 'error' });
    ctx.status = 400;
    ctx.body = { error: 'invalid_grant', error_description: 'Unknown authorization code' };
    return;
  }

  if (grant.used) {
    tokenRequests.inc({ grant_type: 'authorization_code', status: 'error' });
    ctx.status = 400;
    ctx.body = { error: 'invalid_grant', error_description: 'Authorization code has already been used' };
    return;
  }

  if (grant.clientId !== clientId) {
    tokenRequests.inc({ grant_type: 'authorization_code', status: 'error' });
    ctx.status = 400;
    ctx.body = { error: 'invalid_grant', error_description: 'Authorization code was issued to a different client' };
    return;
  }

  if (grant.redirectUri !== redirectUri) {
    ctx.logger.warn({
      clientId,
      expectedRedirectUri: grant.redirectUri,
      providedRedirectUri: redirectUri,
      authCode: code ? `${code.substring(0, 8)}...` : undefined
    }, 'Token exchange failed: redirect_uri mismatch');

    tokenRequests.inc({ grant_type: 'authorization_code', status: 'error' });
    ctx.status = 400;
    ctx.body = { error: 'invalid_grant', error_description: 'redirect_uri mismatch' };
    return;
  }

  if (!codeVerifier) {
    tokenRequests.inc({ grant_type: 'authorization_code', status: 'error' });
    ctx.status = 400;
    ctx.body = { error: 'invalid_request', error_description: 'code_verifier is required' };
    return;
  }

  // RFC 7636 Section 4.1: code_verifier must be 43-128 characters
  if (codeVerifier.length < 43 || codeVerifier.length > 128) {
    ctx.logger.warn({
      clientId,
      codeVerifierLength: codeVerifier.length
    }, 'Token exchange failed: code_verifier length out of range (43-128)');
    tokenRequests.inc({ grant_type: 'authorization_code', status: 'error' });
    ctx.status = 400;
    ctx.body = { error: 'invalid_request', error_description: 'code_verifier must be between 43 and 128 characters per RFC 7636' };
    return;
  }

  const expectedChallenge = sha256ToBase64Url(codeVerifier);
  if (expectedChallenge !== grant.codeChallenge) {
    tokenRequests.inc({ grant_type: 'authorization_code', status: 'error' });
    ctx.status = 400;
    ctx.body = { error: 'invalid_grant', error_description: 'PKCE verification failed' };
    return;
  }

  let mittwaldTokens;
  try {
    // Use the bridge's stored code_verifier for Mittwald (NOT the client's verifier)
    // The client's verifier was already validated above against grant.codeChallenge
    mittwaldTokens = await exchangeMittwaldAuthorizationCode({
      config,
      authorizationCode: grant.mittwaldAuthorizationCode,
      codeVerifier: grant.mittwaldCodeVerifier,
      logger: ctx.logger
    });
  } catch (err) {
    ctx.logger.error({
      error: err instanceof Error ? err.message : String(err),
      clientId,
      mittwaldAuthorizationCode: grant.mittwaldAuthorizationCode
    }, 'Mittwald authorization code exchange failed');
    tokenRequests.inc({ grant_type: 'authorization_code', status: 'error' });
    ctx.status = 502;
    ctx.body = { error: 'temporarily_unavailable', error_description: 'Failed to exchange authorization code with Mittwald' };
    return;
  }

  let bridgeTokens;
  try {
    bridgeTokens = await issueBridgeTokens({ config, grant, mittwaldTokens });
  } catch (err) {
    ctx.logger.error({ error: err instanceof Error ? err.message : String(err), clientId }, 'Failed to issue bridge tokens');
    tokenRequests.inc({ grant_type: 'authorization_code', status: 'error' });
    ctx.status = 500;
    ctx.body = { error: 'server_error', error_description: 'Failed to issue bridge tokens' };
    return;
  }

  const updatedGrant = {
    ...grant,
    mittwaldTokens,
    used: true,
    refreshToken: bridgeTokens.refreshToken,
    refreshTokenExpiresAt: bridgeTokens.refreshTokenExpiresAt
  };
  try {
    await stateStore.updateAuthorizationGrant(updatedGrant);
  } catch (err) {
    ctx.logger.error({ error: err instanceof Error ? err.message : String(err), clientId }, 'Failed to update authorization grant');
    tokenRequests.inc({ grant_type: 'authorization_code', status: 'error' });
    ctx.status = 500;
    ctx.body = { error: 'server_error', error_description: 'Failed to persist authorization grant state' };
    return;
  }

  ctx.logger.info({ clientId, scope: grant.scope }, 'Bridge tokens issued via authorization_code');

  tokenRequests.inc({ grant_type: 'authorization_code', status: 'success' });
  ctx.status = 200;
  ctx.body = {
    access_token: bridgeTokens.accessToken,
    token_type: 'Bearer',
    expires_in: config.bridge.accessTokenTtlSeconds,
    scope: grant.scope,
    refresh_token: bridgeTokens.refreshToken
  };
}

async function handleRefreshTokenGrant(
  ctx: Router.RouterContext,
  { config, stateStore, clientId, body }: GrantHandlerDeps
) {
  const refreshToken = body['refresh_token'];

  const validationError = validateRefreshTokenRequest({ refreshToken, clientId });
  if (validationError) {
    ctx.logger.warn({ error: validationError.body.error, description: validationError.body.error_description, clientId }, 'Refresh token request validation failed');
    tokenRequests.inc({ grant_type: 'refresh_token', status: 'error' });
    ctx.status = validationError.status;
    ctx.body = validationError.body;
    return;
  }

  // Look up the grant by refresh token
  let grant: AuthorizationGrantRecord | null;
  try {
    grant = await stateStore.getAuthorizationGrantByRefreshToken(refreshToken!);
  } catch (err) {
    ctx.logger.error({ error: err instanceof Error ? err.message : String(err), clientId }, 'Failed to look up refresh token');
    tokenRequests.inc({ grant_type: 'refresh_token', status: 'error' });
    ctx.status = 500;
    ctx.body = { error: 'server_error', error_description: 'Failed to look up refresh token' };
    return;
  }

  if (!grant) {
    ctx.logger.warn({ clientId, refreshToken: refreshToken ? `${refreshToken.substring(0, 8)}...` : undefined }, 'Refresh token not found or expired');
    tokenRequests.inc({ grant_type: 'refresh_token', status: 'error' });
    ctx.status = 400;
    ctx.body = { error: 'invalid_grant', error_description: 'Invalid or expired refresh token' };
    return;
  }

  // Verify the client matches
  if (grant.clientId !== clientId) {
    ctx.logger.warn({ clientId, grantClientId: grant.clientId }, 'Refresh token belongs to different client');
    tokenRequests.inc({ grant_type: 'refresh_token', status: 'error' });
    ctx.status = 400;
    ctx.body = { error: 'invalid_grant', error_description: 'Refresh token was issued to a different client' };
    return;
  }

  // Get fresh Mittwald tokens
  let mittwaldTokens;

  // Try to use Mittwald's refresh token if available
  if (grant.mittwaldTokens?.refresh_token) {
    try {
      mittwaldTokens = await refreshMittwaldTokens({
        config,
        refreshToken: grant.mittwaldTokens.refresh_token,
        logger: ctx.logger
      });
      ctx.logger.debug({ clientId }, 'Refreshed Mittwald tokens successfully');
    } catch (err) {
      ctx.logger.warn({
        error: err instanceof Error ? err.message : String(err),
        clientId
      }, 'Failed to refresh Mittwald tokens, using cached tokens');
      // Fall back to cached tokens if refresh fails
      mittwaldTokens = grant.mittwaldTokens;
    }
  } else {
    // No Mittwald refresh token available, use cached tokens
    ctx.logger.debug({ clientId }, 'No Mittwald refresh token, using cached tokens');
    mittwaldTokens = grant.mittwaldTokens;
  }

  if (!mittwaldTokens) {
    ctx.logger.error({ clientId }, 'No Mittwald tokens available for refresh');
    tokenRequests.inc({ grant_type: 'refresh_token', status: 'error' });
    ctx.status = 400;
    ctx.body = { error: 'invalid_grant', error_description: 'Session expired, please re-authenticate' };
    return;
  }

  // Issue new bridge tokens
  let bridgeTokens;
  try {
    bridgeTokens = await issueBridgeTokens({ config, grant, mittwaldTokens });
  } catch (err) {
    ctx.logger.error({ error: err instanceof Error ? err.message : String(err), clientId }, 'Failed to issue bridge tokens');
    tokenRequests.inc({ grant_type: 'refresh_token', status: 'error' });
    ctx.status = 500;
    ctx.body = { error: 'server_error', error_description: 'Failed to issue bridge tokens' };
    return;
  }

  // Update the grant with new tokens (rotate refresh token)
  const updatedGrant = {
    ...grant,
    mittwaldTokens,
    refreshToken: bridgeTokens.refreshToken,
    refreshTokenExpiresAt: bridgeTokens.refreshTokenExpiresAt
  };
  try {
    await stateStore.updateAuthorizationGrant(updatedGrant);
  } catch (err) {
    ctx.logger.error({ error: err instanceof Error ? err.message : String(err), clientId }, 'Failed to update grant after refresh');
    tokenRequests.inc({ grant_type: 'refresh_token', status: 'error' });
    ctx.status = 500;
    ctx.body = { error: 'server_error', error_description: 'Failed to persist refreshed tokens' };
    return;
  }

  ctx.logger.info({ clientId, scope: grant.scope }, 'Bridge tokens issued via refresh_token');

  tokenRequests.inc({ grant_type: 'refresh_token', status: 'success' });
  ctx.status = 200;
  ctx.body = {
    access_token: bridgeTokens.accessToken,
    token_type: 'Bearer',
    expires_in: config.bridge.accessTokenTtlSeconds,
    scope: grant.scope,
    refresh_token: bridgeTokens.refreshToken
  };
}

interface ClientAuthError {
  status: number;
  body: Record<string, string>;
  wwwAuthenticate?: string;
}

function validateAuthorizationCodeRequest(input: {
  code?: string;
  redirectUri?: string;
  clientId?: string;
  codeVerifier?: string;
}): { status: number; body: Record<string, string> } | null {
  if (!input.code) {
    return { status: 400, body: { error: 'invalid_request', error_description: 'code is required' } };
  }

  if (!input.redirectUri) {
    return { status: 400, body: { error: 'invalid_request', error_description: 'redirect_uri is required' } };
  }

  if (!input.clientId) {
    return { status: 400, body: { error: 'invalid_request', error_description: 'client_id is required' } };
  }

  if (!input.codeVerifier) {
    return { status: 400, body: { error: 'invalid_request', error_description: 'code_verifier is required' } };
  }

  return null;
}

function validateRefreshTokenRequest(input: {
  refreshToken?: string;
  clientId?: string;
}): { status: number; body: Record<string, string> } | null {
  if (!input.refreshToken) {
    return { status: 400, body: { error: 'invalid_request', error_description: 'refresh_token is required' } };
  }

  if (!input.clientId) {
    return { status: 400, body: { error: 'invalid_request', error_description: 'client_id is required' } };
  }

  return null;
}

function validateClientCredentials(input: {
  registration: ClientRegistrationRecord;
  authorizationHeader?: string;
  clientId: string;
  clientSecretFromBody?: string;
}): ClientAuthError | null {
  const { registration, authorizationHeader, clientId, clientSecretFromBody } = input;

  switch (registration.tokenEndpointAuthMethod) {
    case 'none':
      return null;
    case 'client_secret_post': {
      if (!registration.clientSecret) {
        return {
          status: 500,
          body: { error: 'server_error', error_description: 'Client secret not available' }
        };
      }
      if (!clientSecretFromBody) {
        return {
          status: 401,
          body: { error: 'invalid_client', error_description: 'client_secret is required' },
          wwwAuthenticate: 'Basic realm="OAuth Bridge"'
        };
      }
      if (clientSecretFromBody !== registration.clientSecret) {
        return {
          status: 401,
          body: { error: 'invalid_client', error_description: 'Invalid client credentials' },
          wwwAuthenticate: 'Basic realm="OAuth Bridge"'
        };
      }
      return null;
    }
    case 'client_secret_basic': {
      if (!registration.clientSecret) {
        return {
          status: 500,
          body: { error: 'server_error', error_description: 'Client secret not available' }
        };
      }
      const parsed = parseBasicAuthHeader(authorizationHeader);
      if (!parsed) {
        return {
          status: 401,
          body: { error: 'invalid_client', error_description: 'Authorization header with Basic credentials is required' },
          wwwAuthenticate: 'Basic realm="OAuth Bridge"'
        };
      }
      if (parsed.clientId !== clientId || parsed.clientSecret !== registration.clientSecret) {
        return {
          status: 401,
          body: { error: 'invalid_client', error_description: 'Invalid client credentials' },
          wwwAuthenticate: 'Basic realm="OAuth Bridge"'
        };
      }
      return null;
    }
    default:
      return {
        status: 400,
        body: { error: 'invalid_client', error_description: 'Unsupported client authentication method' }
      };
  }
}

function parseBasicAuthHeader(header?: string): { clientId: string; clientSecret: string } | null {
  if (!header) {
    return null;
  }
  const [scheme, value] = header.split(' ');
  if (!scheme || scheme.toLowerCase() !== 'basic' || !value) {
    return null;
  }
  try {
    const decoded = Buffer.from(value, 'base64').toString('utf-8');
    const separatorIndex = decoded.indexOf(':');
    if (separatorIndex === -1) {
      return null;
    }
    const clientId = decoded.slice(0, separatorIndex);
    const clientSecret = decoded.slice(separatorIndex + 1);
    return { clientId, clientSecret };
  } catch {
    return null;
  }
}

function sha256ToBase64Url(value: string) {
  return createHash('sha256').update(value).digest().toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
