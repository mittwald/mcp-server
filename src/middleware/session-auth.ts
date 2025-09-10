import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';
import { sessionManager } from '../server/session-manager.js';

// Extend Request interface to include user context from session
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        scope: string;
        token: string;
        sessionId: string;
      };
      sessionId?: string;
    }
  }
}

/**
 * Session-based authentication middleware for MCP OAuth flow
 * 
 * This middleware:
 * 1. Extracts session ID from MCP headers
 * 2. Looks up OAuth tokens in Redis
 * 3. Validates tokens are not expired
 * 4. Returns 401 with OAuth challenge if no valid session
 * 5. Sets req.user with session data if valid
 */
export function createSessionAuthMiddleware() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Extract session ID from MCP headers
      const sessionId = 
        (req.headers['mcp-session-id'] as string) || 
        (req.headers['x-session-id'] as string);

      if (!sessionId) {
        logger.debug('No session ID provided in request headers');
        return sendOAuthChallenge(res, 'No session ID provided');
      }

      // Store session ID on request for later use
      req.sessionId = sessionId;

      // Look up session in Redis
      const session = await sessionManager.getSession(sessionId);
      
      if (!session) {
        logger.debug(`No valid session found for ID: ${sessionId.substring(0, 8)}...`);
        return sendOAuthChallenge(res, 'Invalid or expired session');
      }

      if (!session.oauthAccessToken) {
        logger.debug(`Session exists but no OAuth token found: ${sessionId.substring(0, 8)}...`);
        return sendOAuthChallenge(res, 'No OAuth token in session');
      }

      // Check if token is expired (basic check)
      if (session.expiresAt && session.expiresAt < new Date()) {
        logger.debug(`OAuth token expired for session: ${sessionId.substring(0, 8)}...`);
        return sendOAuthChallenge(res, 'OAuth token expired');
      }

      // Set user context from session
      req.user = {
        userId: session.userId,
        scope: session.scopes?.join(' ') || 'mittwald-api',
        token: session.oauthAccessToken,
        sessionId: sessionId
      };

      logger.debug(`Session authenticated successfully: ${sessionId.substring(0, 8)}... (user: ${session.userId})`);
      next();

    } catch (error) {
      logger.error('Session authentication middleware error:', error);
      return sendOAuthChallenge(res, 'Authentication system error');
    }
  };
}

/**
 * Send HTTP 401 with proper OAuth challenge headers
 * This triggers mcp-remote to start the OAuth flow automatically
 */
function sendOAuthChallenge(res: Response, reason: string) {
  const authorizationUri = `${process.env.OAUTH_AS_BASE || 'https://mittwald-oauth-server.fly.dev'}/auth`;
  const clientId = 'mittwald-mcp-server';
  
  logger.info(`Sending OAuth challenge: ${reason}`);
  
  res.status(401).set({
    'WWW-Authenticate': `Bearer realm="Mittwald MCP Server", authorization_uri="${authorizationUri}", client_id="${clientId}"`,
    'Content-Type': 'application/json'
  }).json({
    error: 'unauthorized',
    error_description: reason,
    authorization_uri: authorizationUri,
    client_id: clientId
  });
}

/**
 * Validation middleware that can be used for specific routes that require authentication
 * This is a stricter version that always fails if no valid session
 */
export function requireValidSession() {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.token) {
      return sendOAuthChallenge(res, 'Authentication required');
    }
    next();
  };
}
