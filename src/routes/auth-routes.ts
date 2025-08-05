import { Router, Request, Response } from 'express';
import { MittwaldOAuthClient } from '../auth/oauth-client.js';
import { OAuthStateManager } from '../auth/oauth-state-manager.js';
import { sessionManager } from '../server/session-manager.js';
import { AuthenticatedRequest } from '../middleware/auth-middleware.js';
import { logger } from '../utils/logger.js';

export class AuthRoutes {
  private router: Router;
  private oauthClient: MittwaldOAuthClient;
  public stateManager: OAuthStateManager;

  constructor(oauthClient: MittwaldOAuthClient) {
    this.router = Router();
    this.oauthClient = oauthClient;
    this.stateManager = new OAuthStateManager();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    this.router.get('/login', this.handleLogin.bind(this));
    this.router.get('/callback', this.handleCallback.bind(this));
    this.router.post('/logout', this.handleLogout.bind(this));
    this.router.get('/status', this.handleStatus.bind(this));
    this.router.get('/user-info', this.handleUserInfo.bind(this));
  }

  private async handleLogin(req: Request, res: Response): Promise<void> {
    try {
      const oauthState = await this.stateManager.createState();
      const { authUrl, codeVerifier, codeChallenge } = await this.oauthClient.generateAuthUrl(oauthState.state);
      
      // Update state with PKCE parameters
      await this.stateManager.updateState(oauthState.state, {
        codeVerifier,
        codeChallenge
      });

      // Store state in session cookie for security
      res.cookie('oauth_state', oauthState.state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 10 * 60 * 1000, // 10 minutes
        sameSite: 'lax'
      });

      logger.info('OAuth login initiated', { 
        state: oauthState.state,
        authUrl: authUrl.substring(0, 100) + '...' // Log partial URL for debugging
      });

      res.redirect(authUrl);
    } catch (error) {
      logger.error('OAuth login error', error);
      res.status(500).json({
        error: 'oauth_login_failed',
        message: 'Failed to initiate OAuth login'
      });
    }
  }

  private async handleCallback(req: Request, res: Response): Promise<void> {
    try {
      const { code, state, error, error_description } = req.query;
      
      if (error) {
        logger.error('OAuth callback error', { error, error_description });
        this.renderAuthResult(res, {
          success: false,
          error: 'oauth_error',
          message: `OAuth authorization failed: ${error}`,
          description: error_description as string
        });
        return;
      }

      if (!code || !state) {
        this.renderAuthResult(res, {
          success: false,
          error: 'invalid_callback',
          message: 'Missing authorization code or state parameter'
        });
        return;
      }

      // Validate state parameter
      const storedState = req.cookies?.oauth_state;
      if (storedState !== state) {
        logger.warn('OAuth state mismatch', { stored: storedState, received: state });
        this.renderAuthResult(res, {
          success: false,
          error: 'invalid_state',
          message: 'State parameter mismatch - possible CSRF attack'
        });
        return;
      }

      const oauthState = await this.stateManager.getState(state as string);
      if (!oauthState) {
        this.renderAuthResult(res, {
          success: false,
          error: 'expired_state',
          message: 'OAuth state expired or invalid'
        });
        return;
      }

      // Exchange code for tokens
      const tokenSet = await this.oauthClient.exchangeCodeForTokens(
        code as string,
        oauthState.codeVerifier,
        state as string
      );

      // Get user info from token
      const userInfo = await this.oauthClient.getUserInfo(tokenSet.access_token!);
      
      // Create user session in Redis
      const sessionId = await sessionManager.createSession(userInfo.sub!, {
        userId: userInfo.sub!,
        oauthAccessToken: tokenSet.access_token!,
        refreshToken: tokenSet.refresh_token,
        expiresAt: new Date(Date.now() + (tokenSet.expires_in! * 1000)),
        currentContext: {},
        scopes: tokenSet.scope?.split(' ') || ['openid']
      });

      // Set session cookie
      res.cookie('sessionId', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 8 * 60 * 60 * 1000, // 8 hours
        sameSite: 'lax'
      });

      // Clear OAuth state
      res.clearCookie('oauth_state');
      await this.stateManager.deleteState(state as string);

      logger.info('OAuth authentication successful', {
        userId: userInfo.sub,
        sessionId,
        userEmail: userInfo.email,
        scopes: tokenSet.scope
      });

      this.renderAuthResult(res, {
        success: true,
        message: 'Authentication successful! You can now close this window and return to Claude Desktop.',
        user: {
          id: userInfo.sub,
          email: userInfo.email,
          name: userInfo.name || userInfo.preferred_username || userInfo.sub
        },
        sessionId,
        scopes: tokenSet.scope?.split(' ') || ['openid']
      });

    } catch (error) {
      logger.error('OAuth callback processing error', error);
      this.renderAuthResult(res, {
        success: false,
        error: 'oauth_callback_failed',
        message: 'Failed to process OAuth callback',
        description: error instanceof Error ? error.message : String(error)
      });
    }
  }

  private async handleLogout(req: Request, res: Response): Promise<void> {
    try {
      const sessionId = req.cookies?.sessionId || req.headers['x-session-id'] as string;
      
      if (sessionId) {
        const session = await sessionManager.getSession(sessionId);
        if (session) {
          // Revoke OAuth token
          try {
            await this.oauthClient.revokeToken(session.oauthAccessToken);
          } catch (revokeError) {
            logger.warn('Token revocation failed', revokeError);
          }
          
          // Destroy session
          await sessionManager.destroySession(sessionId);
          logger.info('User logged out', { userId: session.userId, sessionId });
        }
      }

      res.clearCookie('sessionId');
      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      logger.error('Logout error', error);
      res.status(500).json({
        error: 'logout_failed',
        message: 'Failed to logout'
      });
    }
  }

  private async handleStatus(req: Request, res: Response): Promise<void> {
    try {
      const sessionId = req.cookies?.sessionId || req.headers['x-session-id'] as string;
      
      if (!sessionId) {
        res.json({
          authenticated: false,
          authUrl: '/auth/login'
        });
        return;
      }

      const session = await sessionManager.getSession(sessionId);
      if (!session) {
        res.clearCookie('sessionId');
        res.json({
          authenticated: false,
          authUrl: '/auth/login'
        });
        return;
      }

      // Check if token is expired
      if (session.expiresAt && new Date() > new Date(session.expiresAt)) {
        await sessionManager.destroySession(sessionId);
        res.clearCookie('sessionId');
        res.json({
          authenticated: false,
          authUrl: '/auth/login',
          message: 'Session expired'
        });
        return;
      }

      res.json({
        authenticated: true,
        user: {
          id: session.userId,
          sessionId: session.sessionId,
          context: session.currentContext,
          scopes: session.scopes,
          expiresAt: session.expiresAt,
          lastAccessed: session.lastAccessed
        }
      });
    } catch (error) {
      logger.error('Auth status error', error);
      res.status(500).json({
        error: 'status_check_failed',
        message: 'Failed to check authentication status'
      });
    }
  }

  private async handleUserInfo(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.session) {
        res.status(401).json({
          error: 'authentication_required',
          message: 'Authentication required'
        });
        return;
      }

      // Get fresh user info from OAuth provider
      const userInfo = await this.oauthClient.getUserInfo(req.session.oauthAccessToken);
      
      res.json({
        user: userInfo,
        session: {
          id: req.session.sessionId,
          context: req.session.currentContext,
          scopes: req.session.scopes,
          expiresAt: req.session.expiresAt
        }
      });
    } catch (error) {
      logger.error('User info error', error);
      res.status(500).json({
        error: 'user_info_failed',
        message: 'Failed to get user information'
      });
    }
  }

  private renderAuthResult(res: Response, result: any): void {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mittwald MCP Server - Authentication ${result.success ? 'Successful' : 'Failed'}</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 500px; 
            margin: 100px auto; 
            padding: 20px;
            background: #f5f5f5;
            text-align: center;
        }
        .result-container {
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .success { color: #28a745; }
        .error { color: #dc3545; }
        .logo { font-size: 24px; font-weight: bold; margin-bottom: 30px; color: #333; }
        .icon { font-size: 48px; margin-bottom: 20px; }
        .message { font-size: 18px; margin-bottom: 20px; }
        .details { 
            background: #f8f9fa; 
            padding: 15px; 
            border-radius: 4px; 
            margin: 20px 0;
            text-align: left;
        }
        .details h4 { margin-top: 0; color: #495057; }
        .details p { margin: 5px 0; color: #6c757d; }
        .instruction { 
            background: #e3f2fd; 
            color: #1565c0; 
            padding: 15px; 
            border-radius: 4px; 
            font-weight: 500;
        }
    </style>
</head>
<body>
    <div class="result-container">
        <div class="logo">🔐 Mittwald MCP Server</div>
        
        ${result.success ? `
            <div class="icon success">✅</div>
            <h2 class="success">Authentication Successful!</h2>
            <div class="message">${result.message}</div>
            
            ${result.user ? `
                <div class="details">
                    <h4>User Information:</h4>
                    <p><strong>ID:</strong> ${result.user.id}</p>
                    <p><strong>Name:</strong> ${result.user.name || 'N/A'}</p>
                    <p><strong>Email:</strong> ${result.user.email || 'N/A'}</p>
                    <p><strong>Session ID:</strong> ${result.sessionId}</p>
                    <p><strong>Scopes:</strong> ${result.scopes?.join(', ') || 'N/A'}</p>
                </div>
            ` : ''}
            
            <div class="instruction">
                You can now close this window and return to Claude Desktop to use the Mittwald MCP server.
            </div>
        ` : `
            <div class="icon error">❌</div>
            <h2 class="error">Authentication Failed</h2>
            <div class="message">${result.message}</div>
            
            ${result.description ? `
                <div class="details">
                    <h4>Error Details:</h4>
                    <p>${result.description}</p>
                </div>
            ` : ''}
            
            <div class="instruction">
                Please <a href="/auth/login">try again</a> or contact support if the problem persists.
            </div>
        `}
    </div>
</body>
</html>`;
    
    res.send(html);
  }

  getRouter(): Router {
    return this.router;
  }

  getStateManager(): OAuthStateManager {
    return this.stateManager;
  }
}