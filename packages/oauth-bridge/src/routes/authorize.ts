import Router from '@koa/router';
import { randomUUID, randomBytes, createHash } from 'node:crypto';
import type { BridgeConfig } from '../config.js';
import type { StateStore } from '../state/state-store.js';

/**
 * Generates a cryptographically random code_verifier for PKCE.
 * Per RFC 7636 Section 4.1: 43-128 characters, base64url alphabet.
 * We generate 64 characters (48 bytes base64url encoded).
 */
function generateCodeVerifier(): string {
  // 48 bytes = 64 base64url characters (after removing padding)
  return randomBytes(48)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Computes code_challenge from code_verifier using S256 method.
 * Per RFC 7636: code_challenge = BASE64URL(SHA256(code_verifier))
 */
function computeCodeChallenge(verifier: string): string {
  return createHash('sha256')
    .update(verifier)
    .digest()
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}
import {
  DEFAULT_SCOPES,
  DEFAULT_SCOPE_STRING,
  buildScopeString,
  filterUpstreamScopes,
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
    const upstreamScopes = filterUpstreamScopes(effectiveScopes);
    const mittwaldScopeString = upstreamScopes.length > 0
      ? buildScopeString(upstreamScopes)
      : DEFAULT_SCOPE_STRING;

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

    // Generate bridge's own PKCE pair for the Mittwald relationship
    // Per FR-005: We store the verifier to use at token exchange, and send the challenge to Mittwald
    const mittwaldCodeVerifier = generateCodeVerifier();
    const mittwaldCodeChallenge = computeCodeChallenge(mittwaldCodeVerifier);

    ctx.logger.debug({
      clientState: state ? `${state.substring(0, 8)}...` : undefined,
      internalState: `${internalState.substring(0, 8)}...`,
      clientId,
      mittwaldCodeVerifierLength: mittwaldCodeVerifier.length
    }, 'Generated internal state and bridge PKCE pair for authorization');

    try {
      await stateStore.storeAuthorizationRequest({
        state: state!,
        internalState,
        clientId: clientId!,
        redirectUri: redirectUri!,
        codeChallenge: codeChallenge!, // Client's challenge - to verify client at /token
        codeChallengeMethod: 'S256',
        mittwaldCodeVerifier, // Bridge's verifier - to use with Mittwald at token exchange
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
    // Send bridge's challenge to Mittwald (NOT the client's challenge)
    mittwaldRedirect.searchParams.set('code_challenge', mittwaldCodeChallenge);
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
