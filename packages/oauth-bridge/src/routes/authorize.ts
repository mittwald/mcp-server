import Router from '@koa/router';
import { randomUUID } from 'node:crypto';
import type { BridgeConfig } from '../config.js';
import type { StateStore } from '../state/state-store.js';
import {
  DEFAULT_SCOPES,
  buildScopeString,
  validateRequestedScopes
} from '../config/mittwald-scopes.js';

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

    ctx.logger.debug({
      clientId,
      redirectUri,
      scope,
      state: state ? `${state.substring(0, 8)}...` : undefined,
      responseType,
      codeChallenge: codeChallenge ? 'present' : 'missing',
      resource
    }, 'Incoming authorization request');

    const requestedScopes = parseScopeParameter(scope);
    const effectiveScopes = requestedScopes.length > 0 ? requestedScopes : DEFAULT_SCOPES;
    const scopeValidation = validateRequestedScopes(effectiveScopes);

    if (scopeValidation.unsupported.length > 0) {
      ctx.logger.warn({
        clientId,
        redirectUri,
        unsupportedScopes: scopeValidation.unsupported
      }, 'Authorization request rejected due to unsupported scopes');
      ctx.status = 400;
      ctx.body = {
        error: 'invalid_scope',
        error_description: `Unsupported scopes requested: ${scopeValidation.unsupported.join(', ')}`
      };
      return;
    }

    const scopedRequest = buildScopeString(effectiveScopes);
    // Mittwald requires 'openid profile email mittwald:api' format
    // mittwald:api is a passthrough scope that covers all APIs
    const mittwaldScopeString = 'openid profile email mittwald:api';

    const error = validateRequest({
      responseType,
      clientId,
      redirectUri,
      scope: scopedRequest,
      state,
      codeChallenge,
      codeChallengeMethod,
      allowedRedirectUris: config.redirectUris
    });

    if (error) {
      ctx.logger.warn({ error: error.error, description: error.error_description, clientId, redirectUri }, 'Authorization request validation failed');
      ctx.status = 400;
      ctx.body = error;
      return;
    }

    const internalState = randomUUID();

    ctx.logger.debug({
      clientState: state ? `${state.substring(0, 8)}...` : undefined,
      internalState: `${internalState.substring(0, 8)}...`,
      clientId
    }, 'Generated internal state for authorization');

    try {
      await stateStore.storeAuthorizationRequest({
        state: state!,
        internalState,
        clientId: clientId!,
        redirectUri: redirectUri!,
        codeChallenge: codeChallenge!,
        codeChallengeMethod: 'S256',
        scope: scopedRequest,
        resource,
        createdAt: 0,
        expiresAt: 0
      });
    } catch (err) {
      ctx.logger.error({ error: err instanceof Error ? err.message : String(err), clientId, redirectUri }, 'Failed to persist authorization request');
      ctx.status = 500;
      ctx.body = {
        error: 'server_error',
        error_description: 'Failed to persist authorization request'
      };
      return;
    }

    const mittwaldRedirect = new URL(config.mittwald.authorizationUrl);
    mittwaldRedirect.searchParams.set('response_type', 'code');
    mittwaldRedirect.searchParams.set('client_id', config.mittwald.clientId);
    mittwaldRedirect.searchParams.set('redirect_uri', `${config.bridge.baseUrl}/mittwald/callback`);
    mittwaldRedirect.searchParams.set('scope', mittwaldScopeString);
    mittwaldRedirect.searchParams.set('code_challenge', codeChallenge!);
    mittwaldRedirect.searchParams.set('code_challenge_method', 'S256');
    mittwaldRedirect.searchParams.set('state', internalState);
    if (resource) {
      mittwaldRedirect.searchParams.set('resource', resource);
    }

    ctx.logger.debug({
      clientId,
      mittwaldUrl: mittwaldRedirect.toString(),
      internalState: `${internalState.substring(0, 8)}...`
    }, 'Redirecting to Mittwald OAuth');

    ctx.logger.info({
      clientId,
      redirectUri,
      requestedScopes: scopedRequest,
      forwardedScopes: mittwaldScopeString,
      resource
    }, 'Authorization request forwarded to Mittwald');

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

function parseScopeParameter(scopeParam: string): string[] {
  if (!scopeParam) {
    return [];
  }

  return scopeParam
    .split(/\s+/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}
