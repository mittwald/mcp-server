import express from "express";
import jwt from "jsonwebtoken";
import type { AuthenticatedRequest } from "./auth-types.js";
import { CONFIG } from "./config.js";
import { getSupportedScopes } from "../config/oauth-scopes.js";

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
        // Verify JWT token
        if (!CONFIG.JWT_SECRET) {
          throw new Error('JWT_SECRET not configured');
        }
        
        const decoded = jwt.verify(token, CONFIG.JWT_SECRET) as any;
        
        // Set auth info on request matching MCP SDK AuthInfo interface
        req.auth = {
          token: token, // The JWT token itself
          clientId: decoded.aud || decoded.client_id || 'mittwald-mcp-server',
          scopes: decoded.scope?.split(' ') || [],
          expiresAt: decoded.exp, // Keep as seconds since epoch (not milliseconds)
          extra: {
            userId: decoded.sub,
            accessToken: decoded.access_token,
            refreshToken: decoded.refresh_token
          }
        };
        
        next();
      } catch (jwtError) {
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
      token_url: `${asBase}/token`,
      // Do not suggest a static client_id or redirect_uri.
      // MCP clients (e.g., MCPJam Inspector) should perform Dynamic Client Registration (DCR)
      // and use their own loopback/custom redirect URIs.
      scopes: getSupportedScopes()
    },
    endpoints: {
      authorize: `${asBase}/auth`,
      token: `${asBase}/token`,
      metadata: `${asBase}/.well-known/oauth-authorization-server`
    },
    resource: `${process.env.MCP_PUBLIC_BASE || baseUrl}/mcp`
  });
}
