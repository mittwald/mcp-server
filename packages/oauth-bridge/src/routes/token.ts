import Router from '@koa/router';
import { createHash, randomUUID } from 'node:crypto';
import type { BridgeConfig } from '../config.js';
import type { StateStore } from '../state/state-store.js';
import { exchangeMittwaldAuthorizationCode } from '../services/mittwald.js';

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
      ctx.status = validationError.status;
      ctx.body = validationError.body;
      return;
    }

    const grant = await stateStore.getAuthorizationGrant(code!);

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

    const mittwaldTokens = await exchangeMittwaldAuthorizationCode({
      config,
      authorizationCode: grant.mittwaldAuthorizationCode,
      codeVerifier,
      logger: ctx.logger
    });

    const updatedGrant = {
      ...grant,
      mittwaldTokens,
      used: true
    };
    await stateStore.updateAuthorizationGrant(updatedGrant);

    ctx.status = 200;
    ctx.body = {
      access_token: randomUUID(),
      token_type: 'Bearer',
      expires_in: 3600,
      scope: grant.scope,
      mittwald: mittwaldTokens
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
