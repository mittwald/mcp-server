import Router from '@koa/router';
import { randomUUID } from 'node:crypto';
import type { BridgeConfig } from '../config.js';
import type { StateStore } from '../state/state-store.js';
import {
  DEFAULT_SCOPES,
  MITTWALD_SCOPE_STRING,
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

    // Validate basic request parameters first
    const basicError = validateBasicRequest({ responseType, clientId, redirectUri, state, codeChallenge, codeChallengeMethod });
    if (basicError) {
      ctx.logger.warn({ error: basicError.error, description: basicError.error_description, clientId, redirectUri }, 'Authorization request validation failed');
      ctx.status = 400;
      ctx.body = basicError;
      return;
    }

    // Look up DCR-registered client to validate redirect_uri
    // This is critical: Mittwald's redirect list is IMMUTABLE, so we use DCR
    // to allow clients to register their own redirect URIs with our bridge
    let clientRegistration;
    try {
      clientRegistration = await stateStore.getClientRegistration(clientId!);
    } catch (err) {
      ctx.logger.error({ error: err instanceof Error ? err.message : String(err), clientId }, 'Failed to load client registration');
      ctx.status = 500;
      ctx.body = { error: 'server_error', error_description: 'Failed to load client registration' };
      return;
    }

    if (!clientRegistration) {
      ctx.logger.warn({ clientId }, 'Authorization request for unregistered client - must use DCR first');
      ctx.status = 400;
      ctx.body = { error: 'invalid_client', error_description: 'Client not registered. Use Dynamic Client Registration (POST /register) first.' };
      return;
    }

    // Validate redirect_uri against DCR-registered URIs
    if (!clientRegistration.redirectUris.includes(redirectUri!)) {
      ctx.logger.warn({ clientId, redirectUri, registeredUris: clientRegistration.redirectUris }, 'redirect_uri not in DCR-registered list');
      ctx.status = 400;
      ctx.body = { error: 'invalid_request', error_description: 'redirect_uri is not registered for this client' };
      return;
    }

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
    // Use the Mittwald-specific scope format (see mittwald-scopes.ts for documentation)
    const mittwaldScopeString = MITTWALD_SCOPE_STRING;

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

interface BasicValidationInput {
  responseType?: string;
  clientId?: string;
  redirectUri?: string;
  state?: string;
  codeChallenge?: string;
  codeChallengeMethod?: string;
}

/**
 * Validates basic OAuth request parameters (before DCR lookup).
 * redirect_uri validation against DCR-registered URIs happens separately.
 */
function validateBasicRequest(input: BasicValidationInput): Record<string, string> | null {
  if (input.responseType !== 'code') {
    return { error: 'unsupported_response_type', error_description: 'Only response_type=code is supported' };
  }

  if (!input.clientId) {
    return { error: 'invalid_request', error_description: 'client_id is required' };
  }

  if (!input.redirectUri) {
    return { error: 'invalid_request', error_description: 'redirect_uri is required' };
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
