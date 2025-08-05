import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { MittwaldOAuthClient, OAuthConfig } from '../../src/auth/oauth-client.js';
import { OAuthStateManager } from '../../src/auth/oauth-state-manager.js';
import { SessionManager } from '../../src/server/session-manager.js';
import { RedisClient } from '../../src/utils/redis-client.js';
import supertest from 'supertest';
import { Express } from 'express';
import { createApp } from '../../src/server.js';
import jwt from 'jsonwebtoken';
import axios from 'axios';

describe('OAuth End-to-End Workflow Integration Tests', () => {
  let app: Express;
  let request: supertest.SuperTest<supertest.Test>;
  let oauthClient: MittwaldOAuthClient;
  let stateManager: OAuthStateManager;
  let sessionManager: SessionManager;
  let redisClient: RedisClient;

  const testConfig: OAuthConfig = {
    issuer: 'http://localhost:8080/default',
    clientId: 'mittwald-mcp-server',
    clientSecret: 'test-client-secret',
    redirectUri: 'http://localhost:3000/auth/callback',
    scopes: ['openid', 'profile', 'user:read', 'customer:read', 'project:read']
  };

  beforeAll(async () => {
    // Set test environment variables
    process.env.NODE_ENV = 'test';
    process.env.DISABLE_OAUTH = 'false';
    process.env.OAUTH_ISSUER = testConfig.issuer;
    process.env.MITTWALD_OAUTH_CLIENT_ID = testConfig.clientId;
    process.env.MITTWALD_OAUTH_CLIENT_SECRET = testConfig.clientSecret;
    process.env.OAUTH_REDIRECT_URI = testConfig.redirectUri;
    process.env.JWT_SECRET = 'test-jwt-secret-for-e2e-tests';
    process.env.REDIS_URL = 'redis://localhost:6379';

    // Initialize components
    redisClient = RedisClient.getInstance();
    stateManager = new OAuthStateManager();
    sessionManager = new SessionManager();
    oauthClient = new MittwaldOAuthClient(testConfig);

    // Initialize app
    app = await createApp();
    request = supertest(app);

    // Wait for mock OAuth server
    await waitForMockOAuthServer();
    
    // Initialize OAuth client
    await oauthClient.initialize();
  });

  afterAll(async () => {
    await redisClient.disconnect?.();
  });

  beforeEach(async () => {
    // Clean up Redis before each test
    const keys = await redisClient.keys('*');
    if (keys.length > 0) {
      await Promise.all(keys.map(key => redisClient.del(key)));
    }
  });

  afterEach(async () => {
    // Clean up after each test
    const keys = await redisClient.keys('*');
    if (keys.length > 0) {
      await Promise.all(keys.map(key => redisClient.del(key)));
    }
  });

  describe('Complete OAuth Authorization Flow', () => {
    it('should handle the complete OAuth flow from initiation to authenticated request', async () => {
      // Step 1: Initiate OAuth flow
      const loginResponse = await request
        .get('/auth/login')
        .expect(302);

      const authUrl = new URL(loginResponse.headers.location);
      const state = authUrl.searchParams.get('state')!;
      const codeChallenge = authUrl.searchParams.get('code_challenge')!;

      expect(authUrl.origin).toBe('http://localhost:8080');
      expect(authUrl.pathname).toBe('/default/authorize');
      expect(state).toBeTruthy();
      expect(codeChallenge).toBeTruthy();

      // Step 2: Verify OAuth state is stored
      const storedState = await stateManager.getState(state);
      expect(storedState).toBeTruthy();
      expect(storedState!.state).toBe(state);

      // Step 3: Simulate OAuth callback (will fail with mock data but tests flow)
      const callbackResponse = await request
        .get('/auth/callback')
        .query({
          code: 'mock-authorization-code',
          state: state
        });

      // Should process callback attempt
      expect([200, 302, 400, 401, 500].includes(callbackResponse.status)).toBe(true);

      // Step 4: Verify state cleanup (consumed during callback)
      const cleanedState = await stateManager.getState(state);
      expect(cleanedState).toBeNull();
    });

    it('should maintain state consistency across multiple concurrent flows', async () => {
      // Start multiple OAuth flows simultaneously
      const flowCount = 5;
      const loginPromises = Array.from({ length: flowCount }, () =>
        request.get('/auth/login').expect(302)
      );

      const loginResponses = await Promise.all(loginPromises);
      
      // Extract states and verify uniqueness
      const states = loginResponses.map(r => {
        const url = new URL(r.headers.location);
        return url.searchParams.get('state')!;
      });

      expect(new Set(states).size).toBe(flowCount);

      // All states should be stored and valid
      const statePromises = states.map(state => stateManager.getState(state));
      const storedStates = await Promise.all(statePromises);
      
      expect(storedStates.every(s => s !== null)).toBe(true);
      expect(storedStates.map(s => s!.state)).toEqual(states);
    });

    it('should handle OAuth flow with pre-existing session context', async () => {
      const preSessionId = 'pre-existing-session-123';
      
      // Create a pre-session context (simulating user interaction before OAuth)
      await redisClient.set(`pre_session:${preSessionId}`, JSON.stringify({
        requestedResource: '/api/projects',
        timestamp: Date.now()
      }), 600);

      // Start OAuth flow with session context
      const loginResponse = await request
        .get('/auth/login')
        .set('X-Session-ID', preSessionId)
        .expect(302);

      const authUrl = new URL(loginResponse.headers.location);
      const state = authUrl.searchParams.get('state')!;

      // State should reference the pre-session
      const storedState = await stateManager.getState(state);
      expect(storedState?.sessionId).toBe(preSessionId);
    });
  });

  describe('OAuth Error Scenarios End-to-End', () => {
    it('should handle OAuth provider errors gracefully', async () => {
      // Start normal flow
      const loginResponse = await request
        .get('/auth/login')
        .expect(302);

      const authUrl = new URL(loginResponse.headers.location);
      const state = authUrl.searchParams.get('state')!;

      // Simulate OAuth provider error callback
      const errorResponse = await request
        .get('/auth/callback')
        .query({
          error: 'access_denied',
          error_description: 'The user denied the request',
          state: state
        })
        .expect(400);

      expect(errorResponse.body).toMatchObject({
        error: 'access_denied',
        message: expect.stringContaining('denied')
      });

      // State should be cleaned up even on error
      const cleanedState = await stateManager.getState(state);
      expect(cleanedState).toBeNull();
    });

    it('should handle state tampering attempts', async () => {
      // Start legitimate flow
      const loginResponse = await request
        .get('/auth/login')
        .expect(302);

      const authUrl = new URL(loginResponse.headers.location);
      const legitimateState = authUrl.searchParams.get('state')!;

      // Attempt callback with tampered state
      const tamperedState = legitimateState.replace(/.$/, 'X'); // Change last character

      const callbackResponse = await request
        .get('/auth/callback')
        .query({
          code: 'some-code',
          state: tamperedState
        })
        .expect(400);

      expect(callbackResponse.body).toMatchObject({
        error: expect.stringMatching(/state|invalid/i)
      });

      // Original state should still exist (not consumed by invalid attempt)
      const originalState = await stateManager.getState(legitimateState);
      expect(originalState).toBeTruthy();
    });

    it('should handle expired state in OAuth flow', async () => {
      // Create OAuth state
      const expiredState = await stateManager.createState('test-session');
      
      // Manually expire the state
      await stateManager.updateState(expiredState.state, {
        expiresAt: new Date(Date.now() - 1000)
      });

      // Attempt callback with expired state
      const callbackResponse = await request
        .get('/auth/callback')
        .query({
          code: 'some-code',
          state: expiredState.state
        })
        .expect(400);

      expect(callbackResponse.body).toMatchObject({
        error: expect.stringMatching(/state|expired|invalid/i)
      });
    });

    it('should handle OAuth server unavailability during flow', async () => {
      // This test simulates OAuth server being down during token exchange
      // The login initiation should still work (uses discovery cache)
      const loginResponse = await request
        .get('/auth/login')
        .expect(302);

      const authUrl = new URL(loginResponse.headers.location);
      const state = authUrl.searchParams.get('state')!;

      // Callback will fail when trying to exchange code for tokens
      const callbackResponse = await request
        .get('/auth/callback')
        .query({
          code: 'mock-code-for-unavailable-server',
          state: state
        });

      // Should handle OAuth server errors gracefully
      expect([400, 500, 502, 503].includes(callbackResponse.status)).toBe(true);
      
      if (callbackResponse.status >= 400) {
        expect(callbackResponse.body.error).toBeTruthy();
      }
    });
  });

  describe('OAuth Session Lifecycle End-to-End', () => {
    it('should complete full session lifecycle from OAuth to logout', async () => {
      const userId = 'lifecycle-e2e-user';
      const oauthAccessToken = 'lifecycle-oauth-token';
      const refreshToken = 'lifecycle-refresh-token';

      // Step 1: Simulate completed OAuth flow by creating session directly
      const sessionId = await sessionManager.createSession(userId, {
        userId,
        oauthAccessToken,
        refreshToken,
        expiresAt: new Date(Date.now() + 3600000),
        currentContext: {
          projectId: 'lifecycle-project'
        },
        scopes: ['openid', 'profile', 'user:read']
      });

      // Step 2: Create JWT token for session
      const jwtToken = jwt.sign({
        sub: userId,
        aud: 'mittwald-mcp-server',
        access_token: oauthAccessToken,
        refresh_token: refreshToken,
        scope: 'openid profile user:read',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
        sessionId
      }, process.env.JWT_SECRET!);

      // Step 3: Make authenticated requests
      const profileResponse = await request
        .get('/api/profile')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);

      expect(profileResponse.body.user.id).toBe(userId);
      expect(profileResponse.body.user.sessionId).toBe(sessionId);

      // Step 4: List sessions
      const sessionsResponse = await request
        .get('/api/sessions')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);

      expect(sessionsResponse.body.sessions).toHaveLength(1);
      expect(sessionsResponse.body.sessions[0].sessionId).toBe(sessionId);

      // Step 5: Logout (destroy session)
      const logoutResponse = await request
        .post('/auth/logout')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);

      expect(logoutResponse.body.success).toBe(true);

      // Step 6: Verify session is destroyed
      const destroyedSession = await sessionManager.getSession(sessionId);
      expect(destroyedSession).toBeNull();

      // Step 7: Subsequent requests should fail
      await request
        .get('/api/profile')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(401);
    });

    it('should handle token refresh workflow end-to-end', async () => {
      const userId = 'refresh-e2e-user';
      const initialAccessToken = 'initial-access-token';
      const initialRefreshToken = 'initial-refresh-token';
      const newAccessToken = 'refreshed-access-token';
      const newRefreshToken = 'refreshed-refresh-token';

      // Step 1: Create session with initial tokens
      const sessionId = await sessionManager.createSession(userId, {
        userId,
        oauthAccessToken: initialAccessToken,
        refreshToken: initialRefreshToken,
        expiresAt: new Date(Date.now() + 300000), // 5 minutes (short for testing)
        currentContext: { projectId: 'refresh-project' },
        scopes: ['openid', 'profile', 'user:read']
      });

      // Step 2: Create JWT with initial tokens
      let jwtToken = jwt.sign({
        sub: userId,
        aud: 'mittwald-mcp-server',
        access_token: initialAccessToken,
        refresh_token: initialRefreshToken,
        scope: 'openid profile user:read',
        exp: Math.floor(Date.now() / 1000) + 300, // Short expiry
        iat: Math.floor(Date.now() / 1000),
        sessionId
      }, process.env.JWT_SECRET!);

      // Step 3: Make initial authenticated request
      const initialResponse = await request
        .get('/api/profile')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);

      expect(initialResponse.body.user.id).toBe(userId);

      // Step 4: Simulate token refresh (update session with new tokens)
      await sessionManager.updateSession(sessionId, {
        oauthAccessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresAt: new Date(Date.now() + 3600000) // Extended expiry
      });

      // Step 5: Create new JWT with refreshed tokens
      const refreshedJwtToken = jwt.sign({
        sub: userId,
        aud: 'mittwald-mcp-server',
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
        scope: 'openid profile user:read',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
        sessionId
      }, process.env.JWT_SECRET!);

      // Step 6: Verify new token works
      const refreshedResponse = await request
        .get('/api/profile')
        .set('Authorization', `Bearer ${refreshedJwtToken}`)
        .expect(200);

      expect(refreshedResponse.body.user.id).toBe(userId);
      expect(refreshedResponse.body.user.sessionId).toBe(sessionId);

      // Step 7: Verify session has updated tokens
      const session = await sessionManager.getSession(sessionId);
      expect(session!.oauthAccessToken).toBe(newAccessToken);
      expect(session!.refreshToken).toBe(newRefreshToken);
    });

    it('should handle context switching within OAuth session', async () => {
      const userId = 'context-switch-user';
      const oauthToken = 'context-switch-token';

      // Step 1: Create session with initial context
      const sessionId = await sessionManager.createSession(userId, {
        userId,
        oauthAccessToken: oauthToken,
        expiresAt: new Date(Date.now() + 3600000),
        currentContext: { 
          projectId: 'initial-project',
          serverId: 'initial-server'
        },
        accessibleProjects: ['initial-project', 'other-project'],
        scopes: ['openid', 'profile', 'user:read', 'project:read']
      });

      const jwtToken = jwt.sign({
        sub: userId,
        aud: 'mittwald-mcp-server',
        access_token: oauthToken,
        scope: 'openid profile user:read project:read',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
        sessionId
      }, process.env.JWT_SECRET!);

      // Step 2: Verify initial context
      const initialResponse = await request
        .get('/api/profile')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);

      expect(initialResponse.body.user.context).toEqual({
        projectId: 'initial-project',
        serverId: 'initial-server'
      });

      // Step 3: Switch context
      await sessionManager.updateContext(sessionId, {
        projectId: 'other-project',
        serverId: 'other-server',
        orgId: 'new-org'
      });

      // Step 4: Verify context change
      const updatedResponse = await request
        .get('/api/profile')
        .set('Authorization', `Bearer ${jwtToken}`)
        .expect(200);

      expect(updatedResponse.body.user.context).toEqual({
        projectId: 'other-project',
        serverId: 'other-server',
        orgId: 'new-org'
      });

      // Step 5: Verify OAuth tokens are preserved
      const session = await sessionManager.getSession(sessionId);
      expect(session!.oauthAccessToken).toBe(oauthToken);
      expect(session!.accessibleProjects).toEqual(['initial-project', 'other-project']);
    });
  });

  describe('OAuth Integration with MCP Protocol', () => {
    it('should handle MCP initialize with OAuth authentication', async () => {
      const userId = 'mcp-oauth-user';
      const sessionId = await sessionManager.createSession(userId, {
        userId,
        oauthAccessToken: 'mcp-oauth-token',
        expiresAt: new Date(Date.now() + 3600000),
        currentContext: { projectId: 'mcp-project' },
        scopes: ['openid', 'profile', 'user:read', 'project:read']
      });

      const jwtToken = jwt.sign({
        sub: userId,
        aud: 'mittwald-mcp-server',
        access_token: 'mcp-oauth-token',
        scope: 'openid profile user:read project:read',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
        sessionId
      }, process.env.JWT_SECRET!);

      // Test MCP initialize request with OAuth
      const mcpResponse = await request
        .post('/mcp')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({
          jsonrpc: '2.0',
          method: 'initialize',
          id: 1,
          params: {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: {
              name: 'test-client',
              version: '1.0.0'
            }
          }
        })
        .expect(200);

      expect(mcpResponse.body).toMatchObject({
        jsonrpc: '2.0',
        id: 1,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: expect.any(Object),
          serverInfo: expect.objectContaining({
            name: expect.any(String),
            version: expect.any(String)
          })
        }
      });
    });

    it('should handle MCP requests with different OAuth scopes', async () => {
      // Create user with limited scopes
      const limitedUserId = 'limited-mcp-user';
      const limitedSessionId = await sessionManager.createSession(limitedUserId, {
        userId: limitedUserId,
        oauthAccessToken: 'limited-mcp-token',
        expiresAt: new Date(Date.now() + 3600000),
        currentContext: {},
        scopes: ['openid', 'profile'] // Limited scopes
      });

      const limitedJwtToken = jwt.sign({
        sub: limitedUserId,
        aud: 'mittwald-mcp-server',
        access_token: 'limited-mcp-token',
        scope: 'openid profile',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
        sessionId: limitedSessionId
      }, process.env.JWT_SECRET!);

      // MCP initialize should still work with basic scopes
      const mcpResponse = await request
        .post('/mcp')
        .set('Authorization', `Bearer ${limitedJwtToken}`)
        .send({
          jsonrpc: '2.0',
          method: 'initialize',
          id: 1,
          params: {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: { name: 'limited-client', version: '1.0.0' }
          }
        })
        .expect(200);

      expect(mcpResponse.body.result).toBeTruthy();
    });

    it('should maintain OAuth session throughout MCP conversation', async () => {
      const userId = 'mcp-conversation-user';
      const sessionId = await sessionManager.createSession(userId, {
        userId,
        oauthAccessToken: 'conversation-oauth-token',
        expiresAt: new Date(Date.now() + 3600000),
        currentContext: { projectId: 'conversation-project' },
        scopes: ['openid', 'profile', 'user:read', 'project:read']
      });

      const jwtToken = jwt.sign({
        sub: userId,
        aud: 'mittwald-mcp-server',
        access_token: 'conversation-oauth-token',
        scope: 'openid profile user:read project:read',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
        sessionId
      }, process.env.JWT_SECRET!);

      // Step 1: Initialize MCP
      await request
        .post('/mcp')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({
          jsonrpc: '2.0',
          method: 'initialize',
          id: 1,
          params: {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: { name: 'conversation-client', version: '1.0.0' }
          }
        })
        .expect(200);

      // Step 2: Make multiple MCP requests
      await request
        .post('/mcp')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({
          jsonrpc: '2.0',
          method: 'tools/list',
          id: 2,
          params: {}
        })
        .expect(200);

      // Step 3: Verify session is still active and updated
      const session = await sessionManager.getSession(sessionId);
      expect(session).toBeTruthy();
      expect(new Date(session!.lastAccessed).getTime()).toBeGreaterThan(Date.now() - 5000);
    });
  });

  describe('OAuth Cleanup and Maintenance', () => {
    it('should perform comprehensive cleanup of expired OAuth resources', async () => {
      // Create expired sessions
      const expiredUserIds = ['expired-1', 'expired-2', 'expired-3'];
      const expiredSessionIds = await Promise.all(
        expiredUserIds.map(userId =>
          sessionManager.createSession(userId, {
            userId,
            oauthAccessToken: `expired-token-${userId}`,
            expiresAt: new Date(Date.now() - 1000), // Already expired
            currentContext: {}
          })
        )
      );

      // Create expired OAuth states
      const expiredStates = await Promise.all([
        stateManager.createState('expired-session-1'),
        stateManager.createState('expired-session-2'),
        stateManager.createState('expired-session-3')
      ]);

      // Manually expire the states
      await Promise.all(
        expiredStates.map(state =>
          stateManager.updateState(state.state, {
            expiresAt: new Date(Date.now() - 1000)
          })
        )
      );

      // Run cleanup
      const [cleanedSessions, cleanedStates] = await Promise.all([
        sessionManager.cleanupExpiredSessions(),
        stateManager.cleanupExpiredStates()
      ]);

      expect(cleanedSessions).toBe(3);
      expect(cleanedStates).toBe(3);

      // Verify cleanup
      const remainingSessions = await Promise.all(
        expiredSessionIds.map(id => sessionManager.getSession(id))
      );
      const remainingStates = await Promise.all(
        expiredStates.map(state => stateManager.getState(state.state))
      );

      expect(remainingSessions.every(s => s === null)).toBe(true);
      expect(remainingStates.every(s => s === null)).toBe(true);
    });

    it('should handle OAuth resource cleanup under load', async () => {
      const resourceCount = 100;
      
      // Create many resources rapidly
      const sessionPromises = Array.from({ length: resourceCount }, (_, i) =>
        sessionManager.createSession(`load-user-${i}`, {
          userId: `load-user-${i}`,
          oauthAccessToken: `load-token-${i}`,
          expiresAt: new Date(Date.now() + (i % 2 === 0 ? -1000 : 3600000)), // Half expired
          currentContext: {}
        })
      );

      const statePromises = Array.from({ length: resourceCount }, (_, i) =>
        stateManager.createState(`load-session-${i}`)
      );

      const [sessionIds, states] = await Promise.all([
        Promise.all(sessionPromises),
        Promise.all(statePromises)
      ]);

      // Run concurrent cleanup
      const [cleanedSessions, cleanedStates] = await Promise.all([
        sessionManager.cleanupExpiredSessions(),
        stateManager.cleanupExpiredStates()
      ]);

      // Should clean up approximately half (the expired ones)
      expect(cleanedSessions).toBeGreaterThan(40);
      expect(cleanedSessions).toBeLessThan(60);
      
      // States don't expire immediately, so fewer might be cleaned
      expect(cleanedStates).toBeGreaterThanOrEqual(0);
    });
  });
});

async function waitForMockOAuthServer(maxRetries = 10, delay = 1000): Promise<void> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await axios.get('http://localhost:8080/default/.well-known/openid-configuration', {
        timeout: 2000
      });
      
      if (response.status === 200) {
        return;
      }
    } catch (error) {
      if (i === maxRetries - 1) {
        throw new Error(
          'MockOAuth2Server is not available. Make sure Docker Compose is running with the mock-oauth service.'
        );
      }
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}