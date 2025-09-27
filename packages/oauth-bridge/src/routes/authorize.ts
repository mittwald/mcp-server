import Router from '@koa/router';
import { randomUUID } from 'node:crypto';
import type { BridgeConfig } from '../config.js';
import type { StateStore } from '../state/state-store.js';

interface AuthorizeRouterDeps {
  config: BridgeConfig;
  stateStore: StateStore;
}

export function createAuthorizeRouter({ config, stateStore }: AuthorizeRouterDeps) {
  const router = new Router();

  router.get('/authorize', async (ctx) => {
    const {
      response_type: responseType,
      client_id: clientId,
      redirect_uri: redirectUri,
      scope = '',
      state,
      code_challenge: codeChallenge,
      code_challenge_method: codeChallengeMethod,
      resource
    } = ctx.query as Record<string, string | undefined>;

    const error = validateRequest({
      responseType,
      clientId,
      redirectUri,
      scope,
      state,
      codeChallenge,
      codeChallengeMethod,
      allowedRedirectUris: config.redirectUris
    });

    if (error) {
      ctx.status = 400;
      ctx.body = error;
      return;
    }

    const internalState = randomUUID();

    await stateStore.storeAuthorizationRequest({
      state: state!,
      internalState,
      clientId: clientId!,
      redirectUri: redirectUri!,
      codeChallenge: codeChallenge!,
      codeChallengeMethod: 'S256',
      scope,
      resource,
      createdAt: 0,
      expiresAt: 0
    });

    const mittwaldRedirect = new URL(config.mittwald.authorizationUrl);
    mittwaldRedirect.searchParams.set('response_type', 'code');
    mittwaldRedirect.searchParams.set('client_id', config.mittwald.clientId);
    mittwaldRedirect.searchParams.set('redirect_uri', `${config.bridge.baseUrl}/mittwald/callback`);
    mittwaldRedirect.searchParams.set('scope', scope);
    mittwaldRedirect.searchParams.set('code_challenge', codeChallenge!);
    mittwaldRedirect.searchParams.set('code_challenge_method', 'S256');
    mittwaldRedirect.searchParams.set('state', internalState);
    if (resource) {
      mittwaldRedirect.searchParams.set('resource', resource);
    }

    ctx.status = 303;
    ctx.redirect(mittwaldRedirect.toString());
  });

  return router;
}

interface ValidationInput {
  responseType?: string;
  clientId?: string;
  redirectUri?: string;
  scope?: string;
  state?: string;
  codeChallenge?: string;
  codeChallengeMethod?: string;
  allowedRedirectUris: string[];
}

function validateRequest(input: ValidationInput): Record<string, string> | null {
  if (input.responseType !== 'code') {
    return { error: 'unsupported_response_type', error_description: 'Only response_type=code is supported' };
  }

  if (!input.clientId) {
    return { error: 'invalid_request', error_description: 'client_id is required' };
  }

  if (!input.redirectUri) {
    return { error: 'invalid_request', error_description: 'redirect_uri is required' };
  }

  if (!input.allowedRedirectUris.includes(input.redirectUri)) {
    return { error: 'invalid_request', error_description: 'redirect_uri is not registered' };
  }

  if (!input.state) {
    return { error: 'invalid_request', error_description: 'state is required' };
  }

  if (!input.codeChallenge) {
    return { error: 'invalid_request', error_description: 'code_challenge is required' };
  }

  if ((input.codeChallengeMethod ?? '').toUpperCase() !== 'S256') {
    return { error: 'invalid_request', error_description: 'Only PKCE S256 is supported' };
  }

  return null;
}
