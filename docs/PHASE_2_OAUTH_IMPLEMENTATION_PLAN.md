# Phase 2: OAuth 2.0 Client Implementation - Detailed Plan

## Executive Summary

Transform the existing Redis-based session management system into a complete OAuth 2.0 multitenant MCP server. This phase builds upon the completed Redis infrastructure to add OAuth authentication, token management, and secure user flows.

**Prerequisites**: ✅ **Phase 1 Complete** - Redis session management with multi-tenant isolation

---

## 1. Implementation Roadmap

### **Week 1: OAuth Client Foundation**
- OAuth 2.0 client library integration
- PKCE flow implementation
- Token exchange and validation
- Integration with existing Redis sessions

### **Week 2: Authentication Middleware & Web Interface**
- MCP server authentication middleware
- OAuth callback endpoints
- User authentication flow UI
- Error handling and security

### **Week 3: Integration & Testing**
- End-to-end OAuth flow testing
- Session integration testing
- Automated test suite
- Performance optimization

### **Week 4: User Testing & Deployment**
- User acceptance testing
- Production deployment preparation
- Documentation and guides
- Final security review

---

## 2. Technical Implementation Details

### 2.1 OAuth Client Implementation

#### **2.1.1 OAuth Library Integration**
**File: `src/auth/oauth-client.ts`** (New)

```typescript
import { generators, Issuer, Client, TokenSet } from 'openid-client';
import { logger } from '../utils/logger.js';
import { sessionManager } from '../server/session-manager.js';

export interface OAuthConfig {
  issuer: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

export class MittwaldOAuthClient {
  private client: Client;
  private issuer: Issuer<Client>;
  private config: OAuthConfig;

  constructor(config: OAuthConfig) {
    this.config = config;
  }

  async initialize(): Promise<void> {
    // Discover OAuth endpoints from issuer
    this.issuer = await Issuer.discover(this.config.issuer);
    
    this.client = new this.issuer.Client({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      redirect_uris: [this.config.redirectUri],
      response_types: ['code'],
    });

    logger.info('OAuth client initialized', {
      issuer: this.config.issuer,
      clientId: this.config.clientId
    });
  }

  generateAuthUrl(state: string): { authUrl: string; codeVerifier: string; codeChallenge: string } {
    const codeVerifier = generators.codeVerifier();
    const codeChallenge = generators.codeChallenge(codeVerifier);

    const authUrl = this.client.authorizationUrl({
      scope: this.config.scopes.join(' '),
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      state,
    });

    return { authUrl, codeVerifier, codeChallenge };
  }

  async exchangeCodeForTokens(code: string, codeVerifier: string, state: string): Promise<TokenSet> {
    const tokenSet = await this.client.callback(
      this.config.redirectUri,
      { code, state },
      { code_verifier: codeVerifier }
    );

    return tokenSet;
  }

  async refreshTokens(refreshToken: string): Promise<TokenSet> {
    const tokenSet = await this.client.refresh(refreshToken);
    return tokenSet;
  }

  async validateToken(accessToken: string): Promise<boolean> {
    try {
      const userInfo = await this.client.userinfo(accessToken);
      return !!userInfo.sub;
    } catch (error) {
      logger.error('Token validation failed', error);
      return false;
    }
  }

  async revokeToken(token: string): Promise<void> {
    await this.client.revoke(token);
  }
}
```

#### **2.1.2 OAuth Flow State Management**
**File: `src/auth/oauth-state-manager.ts`** (New)

```typescript
import { redisClient } from '../utils/redis-client.js';

export interface OAuthState {
  state: string;
  codeVerifier: string;
  codeChallenge: string;
  sessionId?: string;
  createdAt: Date;
  expiresAt: Date;
}

export class OAuthStateManager {
  private readonly STATE_PREFIX = 'oauth_state:';
  private readonly STATE_TTL = 600; // 10 minutes

  async createState(sessionId?: string): Promise<OAuthState> {
    const state = this.generateState();
    const now = new Date();
    
    const oauthState: OAuthState = {
      state,
      codeVerifier: '', // Will be set by OAuth client
      codeChallenge: '', // Will be set by OAuth client
      sessionId,
      createdAt: now,
      expiresAt: new Date(now.getTime() + this.STATE_TTL * 1000),
    };

    await redisClient.set(
      `${this.STATE_PREFIX}${state}`,
      JSON.stringify(oauthState),
      this.STATE_TTL
    );

    return oauthState;
  }

  async getState(state: string): Promise<OAuthState | null> {
    const stateData = await redisClient.get(`${this.STATE_PREFIX}${state}`);
    if (!stateData) return null;

    const oauthState: OAuthState = JSON.parse(stateData);
    
    // Check if expired
    if (new Date() > new Date(oauthState.expiresAt)) {
      await this.deleteState(state);
      return null;
    }

    return oauthState;
  }

  async updateState(state: string, updates: Partial<OAuthState>): Promise<void> {
    const existingState = await this.getState(state);
    if (!existingState) throw new Error('OAuth state not found');

    const updatedState = { ...existingState, ...updates };
    await redisClient.set(
      `${this.STATE_PREFIX}${state}`,
      JSON.stringify(updatedState),
      this.STATE_TTL
    );
  }

  async deleteState(state: string): Promise<void> {
    await redisClient.del(`${this.STATE_PREFIX}${state}`);
  }

  private generateState(): string {
    return generators.state();
  }
}
```

### 2.2 Authentication Middleware

#### **2.2.1 MCP Server Authentication Middleware**
**File: `src/middleware/auth-middleware.ts`** (New)

```typescript
import { Request, Response, NextFunction } from 'express';
import { sessionManager } from '../server/session-manager.js';
import { logger } from '../utils/logger.js';

export interface AuthenticatedRequest extends Request {
  session?: import('../server/session-manager.js').UserSession;
  sessionId?: string;
}

export class AuthMiddleware {
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
          message: 'Session ID required',
          authUrl: '/auth/login'
        });
        return;
      }

      const session = await sessionManager.getSession(sessionId);
      if (!session) {
        res.status(401).json({
          error: 'invalid_session',
          message: 'Session expired or invalid',
          authUrl: '/auth/login'
        });
        return;
      }

      // Validate OAuth token is still valid
      const tokenValid = await AuthMiddleware.validateOAuthToken(session.oauthAccessToken);
      if (!tokenValid) {
        await sessionManager.destroySession(sessionId);
        res.status(401).json({
          error: 'token_expired',
          message: 'OAuth token expired, please re-authenticate',
          authUrl: '/auth/login'
        });
        return;
      }

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

  static async validateOAuthToken(accessToken: string): Promise<boolean> {
    // Implement token validation with Mittwald API or OAuth provider
    // This will be integrated with the actual OAuth client
    return true; // Placeholder
  }

  static extractSessionFromMCPRequest(mcpRequest: any): string | null {
    // Extract session ID from MCP request metadata
    return mcpRequest.meta?.sessionId || null;
  }
}
```

#### **2.2.2 OAuth Callback Endpoints**
**File: `src/routes/auth-routes.ts`** (New)

```typescript
import { Router, Request, Response } from 'express';
import { MittwaldOAuthClient } from '../auth/oauth-client.js';
import { OAuthStateManager } from '../auth/oauth-state-manager.js';
import { sessionManager } from '../server/session-manager.js';
import { logger } from '../utils/logger.js';

export class AuthRoutes {
  private router: Router;
  private oauthClient: MittwaldOAuthClient;
  private stateManager: OAuthStateManager;

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
  }

  private async handleLogin(req: Request, res: Response): Promise<void> {
    try {
      const oauthState = await this.stateManager.createState();
      const { authUrl, codeVerifier, codeChallenge } = this.oauthClient.generateAuthUrl(oauthState.state);
      
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
      const { code, state, error } = req.query;
      
      if (error) {
        logger.error('OAuth callback error', { error, description: req.query.error_description });
        res.status(400).json({
          error: 'oauth_error',
          message: `OAuth authorization failed: ${error}`
        });
        return;
      }

      if (!code || !state) {
        res.status(400).json({
          error: 'invalid_callback',
          message: 'Missing authorization code or state'
        });
        return;
      }

      // Validate state parameter
      const storedState = req.cookies?.oauth_state;
      if (storedState !== state) {
        res.status(400).json({
          error: 'invalid_state',
          message: 'State parameter mismatch'
        });
        return;
      }

      const oauthState = await this.stateManager.getState(state as string);
      if (!oauthState) {
        res.status(400).json({
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
      const userInfo = await this.oauthClient.client.userinfo(tokenSet.access_token!);
      
      // Create user session in Redis
      const sessionId = await sessionManager.createSession(userInfo.sub!, {
        userId: userInfo.sub!,
        oauthAccessToken: tokenSet.access_token!,
        refreshToken: tokenSet.refresh_token,
        expiresAt: new Date(Date.now() + (tokenSet.expires_in! * 1000)),
        currentContext: {},
        scopes: tokenSet.scope?.split(' ') || []
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
        sessionId
      });

      res.json({
        success: true,
        message: 'Authentication successful',
        user: {
          id: userInfo.sub,
          email: userInfo.email,
          name: userInfo.name
        },
        sessionId
      });

    } catch (error) {
      logger.error('OAuth callback processing error', error);
      res.status(500).json({
        error: 'oauth_callback_failed',
        message: 'Failed to process OAuth callback'
      });
    }
  }

  private async handleLogout(req: Request, res: Response): Promise<void> {
    try {
      const sessionId = req.cookies?.sessionId;
      if (sessionId) {
        const session = await sessionManager.getSession(sessionId);
        if (session) {
          // Revoke OAuth token
          await this.oauthClient.revokeToken(session.oauthAccessToken);
          // Destroy session
          await sessionManager.destroySession(sessionId);
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
      const sessionId = req.cookies?.sessionId;
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

      res.json({
        authenticated: true,
        user: {
          id: session.userId,
          sessionId: session.sessionId,
          context: session.currentContext,
          scopes: session.scopes,
          expiresAt: session.expiresAt
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

  getRouter(): Router {
    return this.router;
  }
}
```

### 2.3 Web Interface for OAuth Flow

#### **2.3.1 Simple Authentication UI**
**File: `src/public/auth.html`** (New)

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mittwald MCP Server - Authentication</title>
    <style>
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 400px; 
            margin: 100px auto; 
            padding: 20px;
            background: #f5f5f5;
        }
        .auth-container {
            background: white;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            text-align: center;
        }
        .logo { font-size: 24px; font-weight: bold; margin-bottom: 30px; color: #333; }
        .btn { 
            background: #007AFF; 
            color: white; 
            padding: 12px 24px; 
            border: none; 
            border-radius: 6px; 
            cursor: pointer;
            font-size: 16px;
            text-decoration: none;
            display: inline-block;
            margin: 10px 0;
        }
        .btn:hover { background: #0056CC; }
        .status { margin: 20px 0; padding: 15px; border-radius: 6px; }
        .status.success { background: #d4edda; color: #155724; }
        .status.error { background: #f8d7da; color: #721c24; }
        .user-info { text-align: left; margin-top: 20px; }
        .user-info h3 { margin-bottom: 10px; color: #333; }
        .user-info p { margin: 5px 0; color: #666; }
    </style>
</head>
<body>
    <div class="auth-container">
        <div class="logo">🔐 Mittwald MCP Server</div>
        
        <div id="loading" style="display: none;">
            <p>Checking authentication status...</p>
        </div>

        <div id="login-form" style="display: none;">
            <h2>Authentication Required</h2>
            <p>Please sign in with your Mittwald Studio account to access the MCP server.</p>
            <a href="/auth/login" class="btn">Sign in with Mittwald Studio</a>
        </div>

        <div id="authenticated" style="display: none;">
            <h2>✅ Authentication Successful</h2>
            <div class="user-info">
                <h3>Session Information:</h3>
                <p><strong>User ID:</strong> <span id="user-id"></span></p>
                <p><strong>Session ID:</strong> <span id="session-id"></span></p>
                <p><strong>Expires:</strong> <span id="expires-at"></span></p>
                <p><strong>Current Context:</strong></p>
                <ul id="context-list"></ul>
            </div>
            <button onclick="logout()" class="btn" style="background: #dc3545;">Sign Out</button>
        </div>

        <div id="error" class="status error" style="display: none;"></div>
    </div>

    <script>
        async function checkAuthStatus() {
            document.getElementById('loading').style.display = 'block';
            
            try {
                const response = await fetch('/auth/status');
                const data = await response.json();
                
                document.getElementById('loading').style.display = 'none';
                
                if (data.authenticated) {
                    showAuthenticated(data.user);
                } else {
                    showLogin();
                }
            } catch (error) {
                document.getElementById('loading').style.display = 'none';
                showError('Failed to check authentication status');
            }
        }

        function showLogin() {
            document.getElementById('login-form').style.display = 'block';
        }

        function showAuthenticated(user) {
            document.getElementById('authenticated').style.display = 'block';
            document.getElementById('user-id').textContent = user.id;
            document.getElementById('session-id').textContent = user.sessionId;
            document.getElementById('expires-at').textContent = new Date(user.expiresAt).toLocaleString();
            
            const contextList = document.getElementById('context-list');
            contextList.innerHTML = '';
            
            if (user.context.projectId) {
                const li = document.createElement('li');
                li.textContent = `Project: ${user.context.projectId}`;
                contextList.appendChild(li);
            }
            
            if (user.context.serverId) {
                const li = document.createElement('li');
                li.textContent = `Server: ${user.context.serverId}`;
                contextList.appendChild(li);
            }
            
            if (user.context.orgId) {
                const li = document.createElement('li');
                li.textContent = `Organization: ${user.context.orgId}`;
                contextList.appendChild(li);
            }
            
            if (!user.context.projectId && !user.context.serverId && !user.context.orgId) {
                const li = document.createElement('li');
                li.textContent = 'No active context set';
                contextList.appendChild(li);
            }
        }

        async function logout() {
            try {
                await fetch('/auth/logout', { method: 'POST' });
                location.reload();
            } catch (error) {
                showError('Failed to logout');
            }
        }

        function showError(message) {
            const errorDiv = document.getElementById('error');
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        }

        // Check auth status on page load
        checkAuthStatus();
    </script>
</body>
</html>
```

---

## 3. Testing Strategy

### 3.1 Automated Testing Suite

#### **3.1.1 Unit Tests**
**File: `src/tests/auth/oauth-client.test.ts`** (New)

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MittwaldOAuthClient } from '../../auth/oauth-client.js';
import { MockOAuth2Server } from '../mocks/mock-oauth-server.js';

describe('MittwaldOAuthClient', () => {
  let oauthClient: MittwaldOAuthClient;
  let mockServer: MockOAuth2Server;

  beforeEach(async () => {
    mockServer = new MockOAuth2Server();
    await mockServer.start();
    
    oauthClient = new MittwaldOAuthClient({
      issuer: 'http://localhost:8080/default',
      clientId: 'test-client',
      clientSecret: 'test-secret',
      redirectUri: 'http://localhost:3000/auth/callback',
      scopes: ['openid', 'profile', 'api_read', 'api_write']
    });
    
    await oauthClient.initialize();
  });

  afterEach(async () => {
    await mockServer.stop();
  });

  describe('generateAuthUrl', () => {
    it('should generate valid authorization URL with PKCE', () => {
      const state = 'test-state';
      const { authUrl, codeVerifier, codeChallenge } = oauthClient.generateAuthUrl(state);
      
      expect(authUrl).toContain('http://localhost:8080/default/authorize');
      expect(authUrl).toContain('client_id=test-client');
      expect(authUrl).toContain('response_type=code');
      expect(authUrl).toContain('scope=openid%20profile%20api_read%20api_write');
      expect(authUrl).toContain(`state=${state}`);
      expect(authUrl).toContain('code_challenge=');
      expect(authUrl).toContain('code_challenge_method=S256');
      
      expect(codeVerifier).toBeTruthy();
      expect(codeChallenge).toBeTruthy();
      expect(codeVerifier).not.toBe(codeChallenge);
    });
  });

  describe('exchangeCodeForTokens', () => {
    it('should exchange authorization code for tokens', async () => {
      const { codeVerifier } = oauthClient.generateAuthUrl('test-state');
      const mockCode = await mockServer.generateMockCode('test-client');
      
      const tokenSet = await oauthClient.exchangeCodeForTokens(
        mockCode,
        codeVerifier,
        'test-state'
      );
      
      expect(tokenSet.access_token).toBeTruthy();
      expect(tokenSet.refresh_token).toBeTruthy();
      expect(tokenSet.token_type).toBe('Bearer');
      expect(tokenSet.expires_in).toBeGreaterThan(0);
    });

    it('should throw error for invalid authorization code', async () => {
      const { codeVerifier } = oauthClient.generateAuthUrl('test-state');
      
      await expect(
        oauthClient.exchangeCodeForTokens('invalid-code', codeVerifier, 'test-state')
      ).rejects.toThrow();
    });
  });

  describe('validateToken', () => {
    it('should validate valid access token', async () => {
      const mockToken = await mockServer.generateMockToken('test-user');
      const isValid = await oauthClient.validateToken(mockToken);
      expect(isValid).toBe(true);
    });

    it('should reject invalid access token', async () => {
      const isValid = await oauthClient.validateToken('invalid-token');
      expect(isValid).toBe(false);
    });
  });
});
```

#### **3.1.2 Integration Tests**
**File: `src/tests/integration/auth-flow.test.ts`** (New)

```typescript
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { Express } from 'express';
import { createTestApp } from '../helpers/test-app.js';
import { sessionManager } from '../../server/session-manager.js';
import { redisClient } from '../../utils/redis-client.js';

describe('OAuth Authentication Flow Integration', () => {
  let app: Express;
  let agent: request.SuperTest<request.Test>;

  beforeAll(async () => {
    app = await createTestApp();
    agent = request.agent(app);
  });

  afterAll(async () => {
    await redisClient.disconnect();
  });

  beforeEach(async () => {
    // Clean up Redis before each test
    const keys = await redisClient.keys('*');
    if (keys.length > 0) {
      await Promise.all(keys.map(key => redisClient.del(key)));
    }
  });

  describe('GET /auth/login', () => {
    it('should redirect to OAuth provider', async () => {
      const response = await agent.get('/auth/login');
      
      expect(response.status).toBe(302);
      expect(response.headers.location).toContain('localhost:8080/default/authorize');
      expect(response.headers.location).toContain('client_id=mittwald-mcp-server');
      expect(response.headers.location).toContain('response_type=code');
      expect(response.headers.location).toContain('code_challenge=');
      
      // Should set OAuth state cookie
      const cookies = response.headers['set-cookie'];
      expect(cookies.some(cookie => cookie.startsWith('oauth_state='))).toBe(true);
    });
  });

  describe('GET /auth/callback', () => {
    it('should handle successful OAuth callback', async () => {
      // First, initiate login to get state
      const loginResponse = await agent.get('/auth/login');
      const stateCookie = loginResponse.headers['set-cookie']
        .find(cookie => cookie.startsWith('oauth_state='))
        ?.split(';')[0]
        .split('=')[1];

      // Mock successful callback
      const response = await agent
        .get('/auth/callback')
        .query({
          code: 'mock-auth-code',
          state: stateCookie
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user).toBeDefined();
      expect(response.body.sessionId).toBeDefined();
      
      // Should set session cookie
      const cookies = response.headers['set-cookie'];
      expect(cookies.some(cookie => cookie.startsWith('sessionId='))).toBe(true);
    });

    it('should reject callback with invalid state', async () => {
      const response = await agent
        .get('/auth/callback')
        .query({
          code: 'mock-auth-code',
          state: 'invalid-state'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('invalid_state');
    });

    it('should handle OAuth error response', async () => {
      const response = await agent
        .get('/auth/callback')
        .query({
          error: 'access_denied',
          error_description: 'User denied access'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('oauth_error');
    });
  });

  describe('GET /auth/status', () => {
    it('should return unauthenticated for no session', async () => {
      const response = await agent.get('/auth/status');
      
      expect(response.status).toBe(200);
      expect(response.body.authenticated).toBe(false);
      expect(response.body.authUrl).toBe('/auth/login');
    });

    it('should return user info for valid session', async () => {
      // Create test session
      const sessionId = await sessionManager.createSession('test-user', {
        userId: 'test-user',
        oauthAccessToken: 'mock-token',
        expiresAt: new Date(Date.now() + 3600000),
        currentContext: { projectId: 'test-project' },
        scopes: ['api_read', 'api_write']
      });

      const response = await agent
        .get('/auth/status')
        .set('Cookie', `sessionId=${sessionId}`);

      expect(response.status).toBe(200);
      expect(response.body.authenticated).toBe(true);
      expect(response.body.user.id).toBe('test-user');
      expect(response.body.user.sessionId).toBe(sessionId);
      expect(response.body.user.context.projectId).toBe('test-project');
    });
  });

  describe('POST /auth/logout', () => {
    it('should successfully logout user', async () => {
      // Create test session
      const sessionId = await sessionManager.createSession('test-user', {
        userId: 'test-user',
        oauthAccessToken: 'mock-token',
        expiresAt: new Date(Date.now() + 3600000),
        currentContext: {},
        scopes: ['api_read']
      });

      const response = await agent
        .post('/auth/logout')
        .set('Cookie', `sessionId=${sessionId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      // Session should be destroyed
      const session = await sessionManager.getSession(sessionId);
      expect(session).toBeNull();
    });
  });
});
```

#### **3.1.3 End-to-End Tests**
**File: `src/tests/e2e/oauth-mcp-flow.test.ts`** (New)

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawn, ChildProcess } from 'child_process';
import { WebDriver, Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';

describe('OAuth MCP End-to-End Flow', () => {
  let driver: WebDriver;
  let mcpServer: ChildProcess;

  beforeAll(async () => {
    // Start MCP server in test mode
    mcpServer = spawn('npm', ['run', 'start:test'], {
      env: { ...process.env, NODE_ENV: 'test' }
    });

    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Setup Chrome driver
    const options = new chrome.Options();
    options.addArguments('--headless'); // Run in headless mode for CI
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    
    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();
  });

  afterAll(async () => {
    if (driver) await driver.quit();
    if (mcpServer) mcpServer.kill();
  });

  it('should complete full OAuth authentication flow', async () => {
    // Navigate to auth page
    await driver.get('http://localhost:3000/auth.html');
    
    // Should show login form
    await driver.wait(until.elementLocated(By.id('login-form')), 5000);
    const loginButton = await driver.findElement(By.css('a[href="/auth/login"]'));
    expect(await loginButton.isDisplayed()).toBe(true);
    
    // Click login button (redirects to OAuth provider)
    await loginButton.click();
    
    // Should redirect to MockOAuth2Server
    await driver.wait(until.urlContains('localhost:8080'), 5000);
    
    // Fill in mock OAuth form
    const usernameField = await driver.findElement(By.name('username'));
    await usernameField.sendKeys('test-user');
    
    const submitButton = await driver.findElement(By.css('input[type="submit"]'));
    await submitButton.click();
    
    // Should redirect back to our app
    await driver.wait(until.urlContains('localhost:3000'), 10000);
    
    // Should show authenticated state
    await driver.wait(until.elementLocated(By.id('authenticated')), 5000);
    const userIdElement = await driver.findElement(By.id('user-id'));
    const userId = await userIdElement.getText();
    expect(userId).toBe('test-user');
    
    // Should have session cookie
    const cookies = await driver.manage().getCookies();
    const sessionCookie = cookies.find(cookie => cookie.name === 'sessionId');
    expect(sessionCookie).toBeDefined();
    expect(sessionCookie?.value).toBeTruthy();
  });

  it('should maintain session across page reloads', async () => {
    // Complete OAuth flow first
    await driver.get('http://localhost:3000/auth/login');
    await driver.wait(until.urlContains('localhost:8080'), 5000);
    
    const usernameField = await driver.findElement(By.name('username'));
    await usernameField.sendKeys('test-user-2');
    
    const submitButton = await driver.findElement(By.css('input[type="submit"]'));
    await submitButton.click();
    
    await driver.wait(until.urlContains('localhost:3000'), 10000);
    await driver.wait(until.elementLocated(By.id('authenticated')), 5000);
    
    // Reload page
    await driver.navigate().refresh();
    
    // Should still be authenticated
    await driver.wait(until.elementLocated(By.id('authenticated')), 5000);
    const userIdElement = await driver.findElement(By.id('user-id'));
    const userId = await userIdElement.getText();
    expect(userId).toBe('test-user-2');
  });

  it('should handle logout correctly', async () => {
    // Complete OAuth flow first
    await driver.get('http://localhost:3000/auth/login');
    await driver.wait(until.urlContains('localhost:8080'), 5000);
    
    const usernameField = await driver.findElement(By.name('username'));
    await usernameField.sendKeys('test-user-3');
    
    const submitButton = await driver.findElement(By.css('input[type="submit"]'));
    await submitButton.click();
    
    await driver.wait(until.urlContains('localhost:3000'), 10000);
    await driver.wait(until.elementLocated(By.id('authenticated')), 5000);
    
    // Click logout button
    const logoutButton = await driver.findElement(By.css('button[onclick="logout()"]'));
    await logoutButton.click();
    
    // Should show login form again
    await driver.wait(until.elementLocated(By.id('login-form')), 5000);
    const loginForm = await driver.findElement(By.id('login-form'));
    expect(await loginForm.isDisplayed()).toBe(true);
  });
});
```

### 3.2 Performance Testing

#### **3.2.1 Load Testing**
**File: `src/tests/performance/oauth-load.test.ts`** (New)

```typescript
import { describe, it, expect } from 'vitest';
import { performance } from 'perf_hooks';
import { sessionManager } from '../../server/session-manager.js';

describe('OAuth Performance Tests', () => {
  it('should handle concurrent session creation', async () => {
    const concurrency = 100;
    const startTime = performance.now();
    
    const promises = Array.from({ length: concurrency }, (_, i) =>
      sessionManager.createSession(`user-${i}`, {
        userId: `user-${i}`,
        oauthAccessToken: `token-${i}`,
        expiresAt: new Date(Date.now() + 3600000),
        currentContext: {},
        scopes: ['api_read']
      })
    );
    
    const sessionIds = await Promise.all(promises);
    const endTime = performance.now();
    
    expect(sessionIds).toHaveLength(concurrency);
    expect(sessionIds.every(id => typeof id === 'string')).toBe(true);
    
    const totalTime = endTime - startTime;
    const avgTime = totalTime / concurrency;
    
    console.log(`Created ${concurrency} sessions in ${totalTime.toFixed(2)}ms (avg: ${avgTime.toFixed(2)}ms per session)`);
    
    // Should be reasonably fast
    expect(avgTime).toBeLessThan(50); // Less than 50ms per session on average
  });

  it('should handle concurrent session retrievals', async () => {
    // Create test sessions
    const sessionCount = 50;
    const sessionIds = await Promise.all(
      Array.from({ length: sessionCount }, (_, i) =>
        sessionManager.createSession(`load-user-${i}`, {
          userId: `load-user-${i}`,
          oauthAccessToken: `load-token-${i}`,
          expiresAt: new Date(Date.now() + 3600000),
          currentContext: { projectId: `project-${i}` },
          scopes: ['api_read']
        })
      )
    );
    
    // Test concurrent retrieval
    const concurrency = 200; // More retrievals than sessions
    const startTime = performance.now();
    
    const promises = Array.from({ length: concurrency }, (_, i) => {
      const sessionId = sessionIds[i % sessionCount];
      return sessionManager.getSession(sessionId);
    });
    
    const sessions = await Promise.all(promises);
    const endTime = performance.now();
    
    expect(sessions.every(session => session !== null)).toBe(true);
    
    const totalTime = endTime - startTime;
    const avgTime = totalTime / concurrency;
    
    console.log(`Retrieved ${concurrency} sessions in ${totalTime.toFixed(2)}ms (avg: ${avgTime.toFixed(2)}ms per retrieval)`);
    
    // Should be very fast for retrieval
    expect(avgTime).toBeLessThan(10); // Less than 10ms per retrieval on average
  });
});
```

---

## 4. User Testing Plan

### 4.1 User Acceptance Testing Scenarios

#### **4.1.1 Basic Authentication Flow**
**Test Case: First-Time User Authentication**

```markdown
**Scenario**: New user accessing MCP server for the first time

**Prerequisites**: 
- User has Mittwald Studio account
- MCP server is running with OAuth configuration
- MockOAuth2Server is running for testing

**Steps**:
1. User opens Claude Desktop and attempts to use Mittwald MCP server
2. MCP server responds with authentication required message
3. User is directed to authentication URL
4. User sees Mittwald Studio login form
5. User enters credentials and grants permissions
6. User is redirected back to success page
7. User returns to Claude Desktop
8. MCP server operations work with user's token

**Expected Results**:
- ✅ User successfully authenticates
- ✅ Session is created and stored in Redis
- ✅ User can execute MCP tools with their permissions
- ✅ Context is isolated to their session

**Success Criteria**:
- Authentication completes in < 30 seconds
- No errors displayed to user
- User understands next steps
```

#### **4.1.2 Session Management Testing**
**Test Case: Session Persistence and Expiration**

```markdown
**Scenario**: User session behavior over time

**Prerequisites**: 
- User is already authenticated
- Session TTL configured to 8 hours

**Steps**:
1. User authenticates and uses MCP server
2. User closes Claude Desktop
3. User reopens Claude Desktop after 30 minutes
4. User attempts to use MCP server
5. User waits for session to expire (8+ hours)
6. User attempts to use MCP server after expiration

**Expected Results**:
- ✅ Session persists across Claude restarts (within TTL)
- ✅ User doesn't need to re-authenticate within 8 hours
- ✅ After expiration, user is prompted to re-authenticate
- ✅ Re-authentication flow works smoothly

**Success Criteria**:
- Session retrieval < 100ms
- Clear messaging when re-authentication needed
- No data loss during session transitions
```

#### **4.1.3 Multi-User Isolation Testing**
**Test Case: Multiple Users with Separate Contexts**

```markdown
**Scenario**: Multiple users using same MCP server instance

**Prerequisites**: 
- Multiple test users with different Mittwald accounts
- Each user has access to different projects

**Steps**:
1. User A authenticates and sets project context to "Project A"
2. User B authenticates simultaneously and sets project context to "Project B"
3. User A executes project list command
4. User B executes project list command
5. Users execute overlapping commands simultaneously

**Expected Results**:
- ✅ User A only sees Project A resources
- ✅ User B only sees Project B resources
- ✅ No cross-contamination of data
- ✅ Both users can work simultaneously without interference

**Success Criteria**:
- 100% data isolation between users
- No performance degradation with multiple users
- Correct context maintained for each user
```

### 4.2 Usability Testing

#### **4.2.1 Authentication UX Testing**

```markdown
**Focus Areas**:
- Clarity of authentication instructions
- Time to complete OAuth flow
- Error message clarity
- Mobile responsiveness of auth pages

**Test Users**: 
- 3 technical users (developers)
- 2 non-technical users (managers/designers)

**Metrics to Collect**:
- Time to first successful authentication
- Number of errors encountered
- User satisfaction rating (1-10)
- Completion rate

**Test Script**:
1. "Please access the Mittwald MCP server through Claude Desktop"
2. "Complete the authentication process"
3. "Try to use a Mittwald command"
4. [Observe and note any confusion or errors]
5. "Rate your experience from 1-10"
6. "What would make this process easier?"
```

#### **4.2.2 Error Handling Testing**

```markdown
**Scenarios to Test**:
- Network interruption during OAuth flow
- Expired OAuth tokens
- Invalid/revoked tokens
- Server maintenance during authentication
- Browser blocking cookies/JavaScript

**For Each Scenario**:
1. Trigger the error condition
2. Observe user experience
3. Verify error messages are helpful
4. Test recovery process
5. Ensure no data loss or corruption

**Success Criteria**:
- Error messages are non-technical and actionable
- Recovery process is clear and works
- Users can complete their intended tasks after recovery
```

### 4.3 Security Testing

#### **4.3.1 Session Security Validation**

```typescript
// File: src/tests/security/session-security.test.ts
describe('Session Security Tests', () => {
  it('should not allow session hijacking', async () => {
    const userASession = await createUserSession('user-a');
    const userBSession = await createUserSession('user-b');
    
    // Attempt to use User A's session ID with User B's requests
    const response = await request(app)
      .get('/api/projects')
      .set('X-Session-ID', userASession.sessionId)
      .set('User-Agent', 'different-client');
    
    expect(response.status).toBe(401);
  });

  it('should invalidate sessions on suspicious activity', async () => {
    const session = await createUserSession('test-user');
    
    // Simulate multiple rapid requests from different IPs
    await Promise.all([
      makeRequest(session.sessionId, '192.168.1.1'),
      makeRequest(session.sessionId, '10.0.0.1'),
      makeRequest(session.sessionId, '172.16.0.1')
    ]);
    
    // Session should be flagged or invalidated
    const validSession = await sessionManager.getSession(session.sessionId);
    expect(validSession).toBeNull();
  });
});
```

---

## 5. Deployment and Monitoring

### 5.1 Production Deployment Checklist

```yaml
# File: deployment-checklist.yml
production_readiness:
  security:
    - [ ] OAuth client credentials stored securely
    - [ ] HTTPS enforced for all endpoints
    - [ ] Session cookies configured with secure flags
    - [ ] CORS properly configured
    - [ ] Rate limiting implemented
    - [ ] Security headers configured
    
  performance:
    - [ ] Redis connection pooling configured
    - [ ] Session cleanup cron job scheduled
    - [ ] Monitoring and alerting configured
    - [ ] Load testing completed
    - [ ] Performance benchmarks established
    
  reliability:
    - [ ] Health checks implemented
    - [ ] Graceful shutdown handling
    - [ ] Error recovery procedures documented
    - [ ] Backup and restore procedures tested
    - [ ] Rollback plan prepared
    
  compliance:
    - [ ] Privacy policy updated
    - [ ] Terms of service reviewed
    - [ ] GDPR compliance verified
    - [ ] Data retention policies implemented
    - [ ] Audit logging configured
```

### 5.2 Monitoring and Alerting

#### **5.2.1 Key Metrics to Monitor**

```typescript
// File: src/monitoring/oauth-metrics.ts
export interface OAuthMetrics {
  // Authentication Flow Metrics
  authenticationAttempts: number;
  authenticationSuccesses: number;
  authenticationFailures: number;
  averageAuthTime: number;
  
  // Session Metrics
  activeSessions: number;
  sessionCreationRate: number;
  sessionExpirationRate: number;
  averageSessionDuration: number;
  
  // Token Metrics
  tokenRefreshAttempts: number;
  tokenRefreshFailures: number;
  tokenValidationErrors: number;
  
  // Performance Metrics
  redisConnectionTime: number;
  sessionRetrievalTime: number;
  oauthCallbackTime: number;
  
  // Error Metrics
  oauthErrors: Record<string, number>;
  sessionErrors: Record<string, number>;
  rateLimitHits: number;
}
```

#### **5.2.2 Health Check Endpoints**

```typescript
// File: src/routes/health-routes.ts
export class HealthRoutes {
  async checkOAuthHealth(): Promise<HealthStatus> {
    const checks = await Promise.allSettled([
      this.checkRedisConnection(),
      this.checkOAuthProvider(),
      this.checkSessionManager(),
      this.checkTokenValidation()
    ]);
    
    return {
      status: checks.every(check => check.status === 'fulfilled') ? 'healthy' : 'unhealthy',
      checks: {
        redis: checks[0].status === 'fulfilled',
        oauthProvider: checks[1].status === 'fulfilled',
        sessionManager: checks[2].status === 'fulfilled',
        tokenValidation: checks[3].status === 'fulfilled'
      },
      timestamp: new Date().toISOString()
    };
  }
}
```

---

## 6. Success Criteria and Timeline

### 6.1 Phase 2 Success Metrics

**Technical Metrics**:
- ✅ OAuth authentication flow completion rate > 95%
- ✅ Session management response time < 100ms
- ✅ Zero cross-tenant data access incidents
- ✅ Token refresh success rate > 99%
- ✅ 99.9% uptime for authentication service

**Security Metrics**:
- ✅ All OAuth flows use PKCE
- ✅ Sessions properly isolated in Redis
- ✅ No token leakage in logs or URLs
- ✅ Proper token revocation on logout
- ✅ Security audit completed with no critical issues

**User Experience Metrics**:
- ✅ Average authentication time < 30 seconds
- ✅ User satisfaction rating > 8/10
- ✅ < 5% user authentication failure rate
- ✅ Clear error messages and recovery flows
- ✅ Mobile-responsive authentication interface

### 6.2 Implementation Timeline

**Week 1: Foundation (Days 1-7)**
- Day 1-2: OAuth client library integration and configuration
- Day 3-4: PKCE flow implementation and state management
- Day 5-6: Token exchange and validation logic
- Day 7: Integration with existing Redis session system

**Week 2: Middleware & Interface (Days 8-14)**
- Day 8-9: Authentication middleware implementation
- Day 10-11: OAuth callback endpoints and error handling
- Day 12-13: Web interface for authentication flow
- Day 14: Security hardening and configuration

**Week 3: Testing & Integration (Days 15-21)**
- Day 15-16: Unit test suite completion
- Day 17-18: Integration test implementation
- Day 19-20: End-to-end test automation
- Day 21: Performance testing and optimization

**Week 4: User Testing & Deployment (Days 22-28)**
- Day 22-23: User acceptance testing with real users
- Day 24-25: Security testing and audit
- Day 26-27: Production deployment preparation
- Day 28: Go-live and monitoring setup

### 6.3 Risk Mitigation

**High Risk: OAuth Token/API Token Compatibility**
- **Mitigation**: Early verification with Mittwald team
- **Fallback**: Implement complex token creation flow if needed
- **Timeline Impact**: Could add 1-2 weeks if fallback required

**Medium Risk: MockOAuth2Server vs Real OAuth Differences**
- **Mitigation**: Test with real Mittwald Studio OAuth early
- **Fallback**: Adjust implementation based on real provider behavior
- **Timeline Impact**: 2-3 days for adjustments

**Low Risk: Performance at Scale**
- **Mitigation**: Load testing with realistic user counts
- **Fallback**: Redis optimization and connection pooling
- **Timeline Impact**: 1-2 days for optimization

---

## 7. Next Steps

<function_calls>
<invoke name="TodoWrite">
<parameter name="todos">[{"content": "Create detailed Phase 2 implementation plan for OAuth integration", "status": "completed", "priority": "high", "id": "10"}, {"content": "Review Phase 2 plan with stakeholders", "status": "pending", "priority": "high", "id": "11"}, {"content": "Set up development environment for OAuth implementation", "status": "pending", "priority": "medium", "id": "12"}, {"content": "Install OAuth dependencies (openid-client, express)", "status": "pending", "priority": "medium", "id": "13"}]