import express from "express";
import { jwtVerify } from "jose";
import type { AuthenticatedRequest } from "./auth-types.js";
import { CONFIG } from "./config.js";
import { logger } from "../utils/logger.js";
import { getPublicBaseUrl } from "../utils/public-base.js";
import { directTokenValidator, DirectTokenValidationError } from "./direct-token-validator.js";

/**
 * OAuth authentication middleware for MCP server
 * 
 * This middleware enforces OAuth authentication by:
 * 1. Checking for valid JWT tokens in Authorization header
 * 2. Returning 401 with OAuth metadata for unauthenticated requests
 * 3. Setting auth info on request for authenticated requests
 */
export function createOAuthMiddleware() {
  return async (
    req: AuthenticatedRequest,
    res: express.Response,
    next: express.NextFunction,
  ): Promise<void> => {
    const directTokensEnabled = CONFIG.DIRECT_TOKENS?.ENABLED === true;
    try {
      // Check for Authorization header
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // No auth provided - return 401 with OAuth metadata
        return sendOAuthChallenge(res);
      }

      const token = authHeader.substring(7).trim(); // Remove 'Bearer ' prefix
      
      try {
        const handled = await handleJwtToken(token, req, next);
        if (handled) {
          return;
        }
      } catch (error) {
        logger.warn('JWT verification failed', {
          error: error instanceof Error ? error.message : String(error),
        });
        if (!directTokensEnabled) {
          return sendOAuthChallenge(res);
        }
      }

      if (directTokensEnabled) {
        try {
          const handled = await handleDirectToken(token, req, next);
          if (handled) {
            return;
          }
        } catch (error) {
          const message =
            error instanceof DirectTokenValidationError
              ? error.message
              : 'Mittwald token validation failed';

          logger.warn('Direct bearer token rejected', {
            message,
            error: error instanceof Error ? error.message : String(error),
          });

          setInvalidTokenResponse(res, message);
          return;
        }
      }

      // Invalid token and no direct token support available
      return sendOAuthChallenge(res);
      
    } catch (error) {
      console.error('OAuth middleware error:', error);
      res.status(500).json({
        error: 'internal_server_error',
        message: 'Authentication system error'
      });
    }
  };
}

async function handleJwtToken(
  token: string,
  req: AuthenticatedRequest,
  next: express.NextFunction
): Promise<boolean> {
  const bridgeSecret = CONFIG.OAUTH_BRIDGE.JWT_SECRET;
  if (!bridgeSecret) {
    return false;
  }

  const isLikelyJwt = token.split('.').length === 3;
  if (!isLikelyJwt) {
    return false;
  }

  const verifyOptions: Record<string, unknown> = {};
  if (CONFIG.OAUTH_BRIDGE.ISSUER) {
    verifyOptions.issuer = CONFIG.OAUTH_BRIDGE.ISSUER;
  }
  if (CONFIG.OAUTH_BRIDGE.AUDIENCE) {
    verifyOptions.audience = CONFIG.OAUTH_BRIDGE.AUDIENCE;
  }

  const verification = await jwtVerify(token, new TextEncoder().encode(bridgeSecret), verifyOptions);
  const payload = verification.payload as Record<string, unknown>;

  const mittwaldPayload = typeof payload.mittwald === 'object' && payload.mittwald !== null
    ? payload.mittwald as Record<string, unknown>
    : undefined;

  const nowSeconds = Math.floor(Date.now() / 1000);
  const issuedAtSecondsRaw = payload.iat;
  const issuedAtSeconds = typeof issuedAtSecondsRaw === 'number'
    ? issuedAtSecondsRaw
    : (typeof issuedAtSecondsRaw === 'string' ? Number(issuedAtSecondsRaw) : undefined);
  const baseIssuedAt = Number.isFinite(issuedAtSeconds) ? Number(issuedAtSeconds) : nowSeconds;

  const mittwaldExpiresInRaw = mittwaldPayload?.expires_in;
  const mittwaldExpiresIn = typeof mittwaldExpiresInRaw === 'number'
    ? mittwaldExpiresInRaw
    : (typeof mittwaldExpiresInRaw === 'string' ? Number(mittwaldExpiresInRaw) : undefined);

  const mittwaldExpiresAtFromPayload = mittwaldExpiresIn
    ? baseIssuedAt + mittwaldExpiresIn
    : (typeof mittwaldPayload?.expires_at === 'number'
        ? mittwaldPayload.expires_at
        : (typeof payload.exp === 'number' ? payload.exp : undefined));

  const mittwaldRefreshExpiresInCandidate = (mittwaldPayload as Record<string, unknown> | undefined)?.refresh_token_expires_in
    ?? (mittwaldPayload as Record<string, unknown> | undefined)?.refresh_expires_in;
  const mittwaldRefreshTokenExpiresAt = typeof mittwaldRefreshExpiresInCandidate === 'number'
    ? baseIssuedAt + mittwaldRefreshExpiresInCandidate
    : (typeof mittwaldRefreshExpiresInCandidate === 'string'
        ? baseIssuedAt + Number(mittwaldRefreshExpiresInCandidate)
        : undefined);

  const mittwaldAccessToken = typeof mittwaldPayload?.access_token === 'string'
    ? mittwaldPayload.access_token
    : undefined;
  const mittwaldRefreshToken = typeof mittwaldPayload?.refresh_token === 'string'
    ? mittwaldPayload.refresh_token
    : undefined;
  const mittwaldScope = typeof mittwaldPayload?.scope === 'string'
    ? mittwaldPayload.scope
    : (typeof payload.scope === 'string' ? payload.scope : undefined);
  const resource = typeof mittwaldPayload?.resource === 'string'
    ? mittwaldPayload.resource
    : (typeof payload.resource === 'string' ? payload.resource : undefined);

  const scopeString = typeof payload.scope === 'string'
    ? payload.scope
    : (typeof mittwaldScope === 'string' ? mittwaldScope : '');
  const scopes = scopeString ? scopeString.split(' ').filter(Boolean) : [];

  req.auth = {
    token, // The JWT token itself
    clientId: typeof payload.client_id === 'string'
      ? payload.client_id
      : (typeof payload.aud === 'string' ? payload.aud : 'mittwald-mcp-server'),
    scopes,
    expiresAt: typeof payload.exp === 'number' ? payload.exp : undefined,
    extra: {
      userId: typeof payload.sub === 'string' ? payload.sub : undefined,
      mittwaldAccessToken,
      mittwaldRefreshToken,
      mittwaldScope,
      mittwaldScopeSource: 'mittwald',
      mittwaldRequestedScope: mittwaldScope,
      issuer: typeof payload.iss === 'string' ? payload.iss : undefined,
      audience: payload.aud,
      resource,
      mittwaldAccessTokenExpiresAt: mittwaldExpiresAtFromPayload,
      mittwaldRefreshTokenExpiresAt,
      mittwaldIssuedAt: baseIssuedAt,
      mittwaldExpiresIn: mittwaldExpiresIn,
    }
  };

  logger.info('JWT VALIDATION: Token accepted', {
    clientId: req.auth.clientId,
    userId: req.auth.extra?.userId,
    expiresAt: req.auth.expiresAt,
    hasMittwaldToken: !!mittwaldAccessToken,
    mode: 'bridge'
  });

  next();
  return true;
}

async function handleDirectToken(
  token: string,
  req: AuthenticatedRequest,
  next: express.NextFunction
): Promise<boolean> {
  const validation = await directTokenValidator.validate(token);
  const nowSeconds = Math.floor(Date.now() / 1000);
  const accessTokenExpiresAtSeconds =
    nowSeconds + CONFIG.DIRECT_TOKENS.SESSION_TTL_SECONDS;

  req.auth = {
    token,
    clientId: 'mittwald-direct-token',
    scopes: [],
    expiresAt: accessTokenExpiresAtSeconds,
    extra: {
      userId: validation.userId,
      userEmail: validation.email,
      userName: validation.name,
      mittwaldAccessToken: token,
      mittwaldScopeSource: 'direct-bearer',
      mittwaldAccessTokenExpiresAt: accessTokenExpiresAtSeconds,
      mittwaldIssuedAt: nowSeconds,
      authenticationMode: 'direct-bearer',
    },
  };

  logger.info('Direct bearer token accepted', {
    userId: validation.userId,
    hasEmail: Boolean(validation.email),
  });

  next();
  return true;
}

function setInvalidTokenResponse(res: express.Response, message: string): void {
  res
    .status(401)
    .set('WWW-Authenticate', `Bearer error="invalid_token", error_description="${message}"`)
    .json({
      error: 'invalid_token',
      message,
    });
}

/**
 * Sends OAuth challenge response with proper metadata
 */
function sendOAuthChallenge(res: express.Response): void {
  const publicBase = getPublicBaseUrl();

  // Authorization Server base (our oauth-server)
  const asBase = getAuthorizationServerBase();
  const authorizeEndpoint = CONFIG.OAUTH_BRIDGE.AUTHORIZATION_URL
    || process.env.OAUTH_BRIDGE_AUTHORIZATION_URL
    || `${asBase.replace(/\/$/, '')}/authorize`;
  const tokenEndpoint = CONFIG.OAUTH_BRIDGE.TOKEN_URL || `${asBase.replace(/\/$/, '')}/token`;
  
  // Set WWW-Authenticate header as per MCP OAuth spec
  res.set('WWW-Authenticate', `Bearer realm="MCP Server", authorization_uri="${authorizeEndpoint}"`);
  
  res.status(401).json({
    error: 'authentication_required',
    message: 'OAuth authentication required',
    oauth: {
      authorization_url: authorizeEndpoint,
      token_url: tokenEndpoint
    },
    endpoints: {
      authorize: authorizeEndpoint,
      token: tokenEndpoint,
      metadata: `${asBase.replace(/\/$/, '')}/.well-known/oauth-authorization-server`
    },
    resource: `${publicBase}/mcp`
  });
}

function getAuthorizationServerBase(): string {
  return CONFIG.OAUTH_BRIDGE.BASE_URL
    || process.env.OAUTH_BRIDGE_BASE_URL
    || process.env.OAUTH_AS_BASE
    || 'https://mittwald-oauth-server.fly.dev';
}
