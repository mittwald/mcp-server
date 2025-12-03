/**
 * DCR Authentication Middleware
 *
 * Authenticates Dynamic Client Registration management requests
 * (GET/PUT/DELETE /register/:clientId) using registration access tokens.
 *
 * Per RFC 7592:
 * - 401 Unauthorized: Missing or invalid token
 * - 403 Forbidden: Token valid but for wrong client
 *
 * This middleware validates tokens using the RegistrationTokenStore which:
 * - Uses timing-safe comparison for hash matching
 * - Checks token expiration
 * - Checks token revocation status
 */

import type Koa from 'koa';
import type { RegistrationTokenStore, TokenValidationResult } from '../registration-token-store.js';

/**
 * Error response format per RFC 7592 Section 2.2
 */
interface OAuthErrorResponse {
  error: string;
  error_description: string;
}

/**
 * Extracts Bearer token from Authorization header.
 *
 * @param authorizationHeader - The Authorization header value
 * @returns The token if present and valid, null otherwise
 */
function extractBearerToken(authorizationHeader?: string): string | null {
  if (!authorizationHeader) {
    return null;
  }

  const parts = authorizationHeader.split(' ');
  if (parts.length !== 2) {
    return null;
  }

  const [scheme, token] = parts;
  if (!scheme || scheme.toLowerCase() !== 'bearer' || !token) {
    return null;
  }

  return token;
}

/**
 * Sets 401 Unauthorized response with WWW-Authenticate header.
 */
function setUnauthorized(ctx: Koa.Context, description: string): void {
  ctx.status = 401;
  ctx.set('WWW-Authenticate', 'Bearer realm="Dynamic Client Registration"');
  ctx.body = {
    error: 'invalid_token',
    error_description: description,
  } satisfies OAuthErrorResponse;
}

/**
 * Sets 403 Forbidden response.
 */
function setForbidden(ctx: Koa.Context, description: string): void {
  ctx.status = 403;
  ctx.body = {
    error: 'access_denied',
    error_description: description,
  } satisfies OAuthErrorResponse;
}

/**
 * Maps token validation failure reasons to appropriate HTTP responses.
 */
function handleValidationFailure(
  ctx: Koa.Context,
  result: Extract<TokenValidationResult, { valid: false }>
): void {
  switch (result.reason) {
    case 'not_found':
      // Token record doesn't exist - could be expired and cleaned up
      setUnauthorized(ctx, 'Registration access token not found or expired');
      break;
    case 'invalid':
      // Token hash doesn't match
      setUnauthorized(ctx, 'Invalid registration access token');
      break;
    case 'expired':
      // Token has expired
      setUnauthorized(ctx, 'Registration access token has expired');
      break;
    case 'revoked':
      // Token was explicitly revoked
      setUnauthorized(ctx, 'Registration access token has been revoked');
      break;
    default:
      setUnauthorized(ctx, 'Invalid registration access token');
  }
}

/**
 * Creates a DCR authentication middleware factory.
 *
 * This middleware validates registration access tokens for DCR management
 * endpoints. It should be applied to:
 * - GET /register/:clientId
 * - PUT /register/:clientId
 * - DELETE /register/:clientId
 *
 * But NOT to:
 * - POST /register (creates new client, no token required)
 *
 * @param tokenStore - The RegistrationTokenStore instance for token validation
 * @returns Koa middleware function
 *
 * @example
 * ```typescript
 * const dcrAuth = createDcrAuthMiddleware(tokenStore);
 *
 * router.get('/register/:clientId', dcrAuth, async (ctx) => {
 *   // Token is valid and matches clientId
 * });
 * ```
 */
export function createDcrAuthMiddleware(tokenStore: RegistrationTokenStore) {
  return async (ctx: Koa.Context, next: Koa.Next): Promise<void> => {
    // Extract client ID from route parameters
    const clientId = ctx.params?.clientId;
    if (!clientId) {
      // This shouldn't happen if middleware is applied to correct routes
      ctx.logger?.warn?.('DCR auth middleware applied to route without clientId param');
      setUnauthorized(ctx, 'Client ID is required');
      return;
    }

    // Extract Bearer token from Authorization header
    const token = extractBearerToken(ctx.request.headers.authorization);
    if (!token) {
      ctx.logger?.warn?.({ clientId }, 'DCR request missing or malformed Authorization header');
      setUnauthorized(ctx, 'A valid registration access token is required');
      return;
    }

    // Validate token against the store
    const result = await tokenStore.validateToken(clientId, token);

    if (!result.valid) {
      ctx.logger?.warn?.(
        { clientId, reason: result.reason },
        'DCR token validation failed'
      );
      handleValidationFailure(ctx, result);
      return;
    }

    // Token is valid - store the record in context for potential use by handlers
    ctx.state.registrationToken = result.record;

    await next();
  };
}

// Re-export for convenience
export type { RegistrationTokenStore } from '../registration-token-store.js';
