import Router from '@koa/router';
import { createHash } from 'node:crypto';
import type { BridgeConfig } from '../config.js';
import type { StateStore } from '../state/state-store.js';
import { exchangeMittwaldAuthorizationCode } from '../services/mittwald.js';
import { issueBridgeTokens } from '../services/bridge-tokens.js';

interface TokenRouterDeps {
  config: BridgeConfig;
  stateStore: StateStore;
}

export function createTokenRouter({ config, stateStore }: TokenRouterDeps) {
  const router = new Router();

  router.post('/token', async (ctx) => {
    const body = ctx.request.body as Record<string, string | undefined>;

    const grantType = body['grant_type'];
    const code = body['code'];
    const redirectUri = body['redirect_uri'];
    const clientId = body['client_id'];
    const codeVerifier = body['code_verifier'];

    const validationError = validateTokenRequest({ grantType, code, redirectUri, clientId, codeVerifier });
    if (validationError) {
      ctx.logger.warn({ error: validationError.body.error, description: validationError.body.error_description, clientId }, 'Token request validation failed');
      ctx.status = validationError.status;
      ctx.body = validationError.body;
      return;
    }

    let grant;
    try {
      grant = await stateStore.getAuthorizationGrant(code!);
    } catch (err) {
      ctx.logger.error({ error: err instanceof Error ? err.message : String(err), clientId }, 'Failed to read authorization grant');
      ctx.status = 500;
      ctx.body = { error: 'server_error', error_description: 'Failed to read authorization grant' };
      return;
    }

    if (!grant) {
      ctx.status = 400;
      ctx.body = { error: 'invalid_grant', error_description: 'Unknown authorization code' };
      return;
    }

    if (grant.used) {
      ctx.status = 400;
      ctx.body = { error: 'invalid_grant', error_description: 'Authorization code has already been used' };
      return;
    }

    if (grant.clientId !== clientId) {
      ctx.status = 400;
      ctx.body = { error: 'invalid_grant', error_description: 'Authorization code was issued to a different client' };
      return;
    }

    if (grant.redirectUri !== redirectUri) {
      ctx.status = 400;
      ctx.body = { error: 'invalid_grant', error_description: 'redirect_uri mismatch' };
      return;
    }

    if (!codeVerifier) {
      ctx.status = 400;
      ctx.body = { error: 'invalid_request', error_description: 'code_verifier is required' };
      return;
    }

    const expectedChallenge = sha256ToBase64Url(codeVerifier);
    if (expectedChallenge !== grant.codeChallenge) {
      ctx.status = 400;
      ctx.body = { error: 'invalid_grant', error_description: 'PKCE verification failed' };
      return;
    }

    let mittwaldTokens;
    try {
      mittwaldTokens = await exchangeMittwaldAuthorizationCode({
        config,
        authorizationCode: grant.mittwaldAuthorizationCode,
        codeVerifier,
        logger: ctx.logger
      });
    } catch (err) {
      ctx.logger.error({
        error: err instanceof Error ? err.message : String(err),
        clientId,
        mittwaldAuthorizationCode: grant.mittwaldAuthorizationCode
      }, 'Mittwald authorization code exchange failed');
      ctx.status = 502;
      ctx.body = { error: 'temporarily_unavailable', error_description: 'Failed to exchange authorization code with Mittwald' };
      return;
    }

    let bridgeTokens;
    try {
      bridgeTokens = await issueBridgeTokens({ config, grant, mittwaldTokens });
    } catch (err) {
      ctx.logger.error({ error: err instanceof Error ? err.message : String(err), clientId }, 'Failed to issue bridge tokens');
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
      ctx.status = 500;
      ctx.body = { error: 'server_error', error_description: 'Failed to persist authorization grant state' };
      return;
    }

    ctx.logger.info({ clientId, scope: grant.scope }, 'Bridge tokens issued');

    ctx.status = 200;
    ctx.body = {
      access_token: bridgeTokens.accessToken,
      token_type: 'Bearer',
      expires_in: config.bridge.accessTokenTtlSeconds,
      scope: grant.scope,
      refresh_token: bridgeTokens.refreshToken
    };
  });

  return router;
}

function validateTokenRequest(input: {
  grantType?: string;
  code?: string;
  redirectUri?: string;
  clientId?: string;
  codeVerifier?: string;
}): { status: number; body: Record<string, string> } | null {
  if (input.grantType !== 'authorization_code') {
    return { status: 400, body: { error: 'unsupported_grant_type', error_description: 'Only authorization_code is supported' } };
  }

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

function sha256ToBase64Url(value: string) {
  return createHash('sha256').update(value).digest().toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
