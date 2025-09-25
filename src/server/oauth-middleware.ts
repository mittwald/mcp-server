import express from "express";
import jwt from "jsonwebtoken";
import type { AuthenticatedRequest } from "./auth-types.js";
import { CONFIG } from "./config.js";
import { logger } from "../utils/logger.js";

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
    try {
      // Check for Authorization header
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // No auth provided - return 401 with OAuth metadata
        return sendOAuthChallenge(res);
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      
      try {
        // Verify JWT token using same key as OAuth server
        const jwtSigningKey = process.env.JWT_SIGNING_KEY || process.env.JWT_SECRET || 'development-key-not-secure';

        if (!jwtSigningKey || jwtSigningKey === 'development-key-not-secure') {
          throw new Error('JWT_SIGNING_KEY not configured - must match OAuth server');
        }

        const decoded = jwt.verify(token, jwtSigningKey) as any;

        const mittwaldAccessToken = typeof decoded.mittwald_access_token === 'string'
          ? decoded.mittwald_access_token
          : undefined;
        const mittwaldRefreshToken = typeof decoded.mittwald_refresh_token === 'string'
          ? decoded.mittwald_refresh_token
          : undefined;
        const mittwaldScope = typeof decoded.mittwald_scope === 'string' ? decoded.mittwald_scope : undefined;
        const mittwaldScopeSource = typeof decoded.mittwald_scope_source === 'string'
          ? decoded.mittwald_scope_source
          : undefined;
        const mittwaldRequestedScope = typeof decoded.mittwald_requested_scope === 'string'
          ? decoded.mittwald_requested_scope
          : undefined;

        // Set auth info on request matching MCP SDK AuthInfo interface
        req.auth = {
          token: token, // The JWT token itself
          clientId: decoded.client_id || 'mittwald-mcp-server',
          scopes: decoded.scope?.split(' ') || [],
          expiresAt: decoded.exp, // Keep as seconds since epoch (not milliseconds)
          extra: {
            userId: decoded.sub,
            mittwaldAccessToken,
            mittwaldRefreshToken,
            mittwaldScope,
            mittwaldScopeSource,
            mittwaldRequestedScope,
            issuer: decoded.iss,
            audience: decoded.aud
          }
        };

        logger.info('JWT VALIDATION: Token accepted', {
          clientId: req.auth.clientId,
          userId: decoded.sub,
          expiresAt: decoded.exp,
          hasMittwaldToken: !!mittwaldAccessToken
        });
        
        next();
      } catch (error) {
        console.warn('JWT verification failed', error);
        // Invalid token - return 401 with OAuth metadata
        return sendOAuthChallenge(res);
      }
      
    } catch (error) {
      console.error('OAuth middleware error:', error);
      res.status(500).json({
        error: 'internal_server_error',
        message: 'Authentication system error'
      });
    }
  };
}

/**
 * Sends OAuth challenge response with proper metadata
 */
function sendOAuthChallenge(res: express.Response): void {
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? (process.env.MCP_PUBLIC_BASE || 'https://mcp.mittwald-mcp-fly.fly.dev')
    : 'https://localhost:3000';
  
  // Authorization Server base (our oauth-server)
  const asBase = process.env.OAUTH_AS_BASE || 'https://mittwald-oauth-server.fly.dev';
  
  // Set WWW-Authenticate header as per MCP OAuth spec
  res.set('WWW-Authenticate', `Bearer realm="MCP Server", authorization_uri="${asBase}/auth"`);
  
  res.status(401).json({
    error: 'authentication_required',
    message: 'OAuth authentication required',
    oauth: {
      authorization_url: `${asBase}/auth`,
      token_url: `${asBase}/token`
    },
    endpoints: {
      authorize: `${asBase}/auth`,
      token: `${asBase}/token`,
      metadata: `${asBase}/.well-known/oauth-authorization-server`
    },
    resource: `${process.env.MCP_PUBLIC_BASE || baseUrl}/mcp`
  });
}
