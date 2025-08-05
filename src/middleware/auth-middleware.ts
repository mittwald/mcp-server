import { Request, Response, NextFunction } from 'express';
import { sessionManager, UserSession } from '../server/session-manager.js';
import { logger } from '../utils/logger.js';

export interface AuthenticatedRequest extends Request {
  session?: UserSession;
  sessionId?: string;
}

export class AuthMiddleware {
  /**
   * Middleware to validate session for HTTP requests
   */
  static async validateSession(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const sessionId = req.headers['x-session-id'] as string || req.cookies?.sessionId;
      
      if (!sessionId) {
        res.status(401).json({
          error: 'authentication_required',
          message: 'Session ID required for authentication',
          authUrl: '/auth/login'
        });
        return;
      }

      const session = await sessionManager.getSession(sessionId);
      if (!session) {
        res.status(401).json({
          error: 'invalid_session',
          message: 'Session expired or invalid. Please re-authenticate.',
          authUrl: '/auth/login'
        });
        return;
      }

      // Check if OAuth token is expired
      if (session.expiresAt && new Date() > new Date(session.expiresAt)) {
        logger.info('Session token expired', { sessionId, userId: session.userId });
        await sessionManager.destroySession(sessionId);
        res.status(401).json({
          error: 'token_expired',
          message: 'OAuth token expired. Please re-authenticate.',
          authUrl: '/auth/login'
        });
        return;
      }

      // Update last accessed time
      await sessionManager.updateSession(sessionId, { lastAccessed: new Date() });

      req.session = session;
      req.sessionId = sessionId;
      next();
    } catch (error) {
      logger.error('Authentication middleware error', error);
      res.status(500).json({
        error: 'authentication_error',
        message: 'Authentication validation failed'
      });
    }
  }

  /**
   * Extract session ID from MCP request metadata
   */
  static extractSessionFromMCPRequest(mcpRequest: any): string | null {
    // MCP requests can include session ID in different ways
    return mcpRequest?.meta?.sessionId || 
           mcpRequest?.params?.meta?.sessionId || 
           mcpRequest?.sessionId || 
           null;
  }

  /**
   * Validate session for MCP tool calls
   */
  static async validateMCPSession(sessionId: string): Promise<UserSession | null> {
    if (!sessionId) {
      return null;
    }

    try {
      const session = await sessionManager.getSession(sessionId);
      if (!session) {
        return null;
      }

      // Check if token is expired
      if (session.expiresAt && new Date() > new Date(session.expiresAt)) {
        logger.info('MCP session token expired', { sessionId, userId: session.userId });
        await sessionManager.destroySession(sessionId);
        return null;
      }

      // Update last accessed time
      await sessionManager.updateSession(sessionId, { lastAccessed: new Date() });

      return session;
    } catch (error) {
      logger.error('MCP session validation error', error);
      return null;
    }
  }

  /**
   * Check if user has required scopes
   */
  static hasRequiredScopes(session: UserSession, requiredScopes: string[]): boolean {
    if (!session.scopes || session.scopes.length === 0) {
      return false;
    }

    return requiredScopes.every(scope => session.scopes!.includes(scope));
  }

  /**
   * Middleware to require specific OAuth scopes
   */
  static requireScopes(requiredScopes: string[]) {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
      if (!req.session) {
        res.status(401).json({
          error: 'authentication_required',
          message: 'Authentication required'
        });
        return;
      }

      if (!this.hasRequiredScopes(req.session, requiredScopes)) {
        res.status(403).json({
          error: 'insufficient_scope',
          message: `Required scopes: ${requiredScopes.join(', ')}`,
          userScopes: req.session.scopes || []
        });
        return;
      }

      next();
    };
  }

  /**
   * Optional authentication middleware - doesn't fail if no session
   */
  static async optionalAuth(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const sessionId = req.headers['x-session-id'] as string || req.cookies?.sessionId;
      
      if (sessionId) {
        const session = await sessionManager.getSession(sessionId);
        if (session && (!session.expiresAt || new Date() <= new Date(session.expiresAt))) {
          req.session = session;
          req.sessionId = sessionId;
          await sessionManager.updateSession(sessionId, { lastAccessed: new Date() });
        }
      }

      next();
    } catch (error) {
      logger.error('Optional auth middleware error', error);
      // Continue without authentication
      next();
    }
  }
}