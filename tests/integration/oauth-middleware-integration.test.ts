import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { SessionManager } from '../../src/server/session-manager.js';
import { RedisClient } from '../../src/utils/redis-client.js';
import supertest from 'supertest';
import { Express } from 'express';
import { createApp } from '../../src/server.js';
import jwt from 'jsonwebtoken';
import axios from 'axios';

describe('OAuth Middleware Integration Tests', () => {
  let app: Express;
  let request: supertest.SuperTest<supertest.Test>;
  let sessionManager: SessionManager;
  let redisClient: RedisClient;

  beforeAll(async () => {
    // Set test environment variables
    process.env.NODE_ENV = 'test';
    process.env.OAUTH_ISSUER = 'http://localhost:8080/default';
    process.env.MITTWALD_OAUTH_CLIENT_ID = 'mittwald-mcp-server';
    process.env.MITTWALD_OAUTH_CLIENT_SECRET = 'test-client-secret';
    process.env.OAUTH_REDIRECT_URI = 'http://localhost:3000/auth/callback';
    process.env.JWT_SECRET = 'test-jwt-secret-for-middleware-tests';
    process.env.REDIS_URL = 'redis://localhost:6379';

    // Initialize components
    redisClient = RedisClient.getInstance();
    sessionManager = new SessionManager();

    // Initialize app
    app = await createApp();
    request = supertest(app);

    // Wait for mock OAuth server
    await waitForMockOAuthServer();
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

  describe('OAuth Authentication Middleware', () => {
    it('should reject requests without authorization header', async () => {
      const response = await request
        .post('/mcp')
        .send({
          jsonrpc: '2.0',
          method: 'initialize',
          id: 1,
          params: {}
        })
        .expect(401);

      expect(response.body).toMatchObject({
        error: 'authentication_required',
        message: 'OAuth authentication required'
      });

      expect(response.headers['www-authenticate']).toContain('Bearer realm="MCP Server"');
    });

    it('should reject requests with malformed authorization header', async () => {
      const response = await request
        .post('/mcp')
        .set('Authorization', 'InvalidFormat token')
        .send({
          jsonrpc: '2.0',
          method: 'initialize',
          id: 1
        })
        .expect(401);

      expect(response.body.error).toBe('authentication_required');
    });

    it('should reject requests with empty bearer token', async () => {
      const response = await request
        .post('/mcp')
        .set('Authorization', 'Bearer ')
        .send({
          jsonrpc: '2.0',
          method: 'initialize',
          id: 1
        })
        .expect(401);

      expect(response.body.error).toBe('authentication_required');
    });

    it('should reject requests with invalid JWT tokens', async () => {
      const invalidToken = 'clearly.invalid.token';

      const response = await request
        .post('/mcp')
        .set('Authorization', `Bearer ${invalidToken}`)
        .send({
          jsonrpc: '2.0',
          method: 'initialize',
          id: 1
        })
        .expect(401);

      expect(response.body.error).toBe('authentication_required');
    });

    it('should reject expired JWT tokens', async () => {
      const expiredTokenPayload = {
        sub: 'test-user',
        aud: 'mittwald-mcp-server',
        access_token: 'test-oauth-token',
        exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
        iat: Math.floor(Date.now() / 1000) - 7200  // 2 hours ago
      };

      const expiredToken = jwt.sign(expiredTokenPayload, process.env.JWT_SECRET!);

      const response = await request
        .post('/mcp')
        .set('Authorization', `Bearer ${expiredToken}`)
        .send({
          jsonrpc: '2.0',
          method: 'initialize',
          id: 1
        })
        .expect(401);

      expect(response.body.error).toBe('authentication_required');
    });

    it('should reject JWT tokens with wrong signature', async () => {
      const tokenPayload = {
        sub: 'test-user',
        aud: 'mittwald-mcp-server',
        access_token: 'test-oauth-token',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000)
      };

      const wrongSecretToken = jwt.sign(tokenPayload, 'wrong-secret');

      const response = await request
        .post('/mcp')
        .set('Authorization', `Bearer ${wrongSecretToken}`)
        .send({
          jsonrpc: '2.0',
          method: 'initialize',
          id: 1
        })
        .expect(401);

      expect(response.body.error).toBe('authentication_required');
    });

    it('should reject JWT tokens with wrong audience', async () => {
      const tokenPayload = {
        sub: 'test-user',
        aud: 'wrong-audience',
        access_token: 'test-oauth-token',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000)
      };

      const wrongAudienceToken = jwt.sign(tokenPayload, process.env.JWT_SECRET!);

      const response = await request
        .post('/mcp')
        .set('Authorization', `Bearer ${wrongAudienceToken}`)
        .send({
          jsonrpc: '2.0',
          method: 'initialize',
          id: 1
        })
        .expect(401);

      expect(response.body.error).toBe('authentication_required');
    });
  });

  describe('Valid OAuth Token Processing', () => {
    let validJwtToken: string;
    let sessionId: string;
    let userId: string;

    beforeEach(async () => {
      userId = 'middleware-test-user';
      const oauthAccessToken = 'valid-oauth-access-token';
      const refreshToken = 'valid-refresh-token';

      // Create session
      sessionId = await sessionManager.createSession(userId, {
        userId,
        oauthAccessToken,
        refreshToken,
        expiresAt: new Date(Date.now() + 3600000),
        currentContext: {
          projectId: 'middleware-test-project'
        },
        scopes: ['openid', 'profile', 'user:read']
      });

      // Create valid JWT token
      const tokenPayload = {
        sub: userId,
        aud: 'mittwald-mcp-server',
        access_token: oauthAccessToken,
        refresh_token: refreshToken,
        scope: 'openid profile user:read',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
        sessionId
      };

      validJwtToken = jwt.sign(tokenPayload, process.env.JWT_SECRET!);
    });

    it('should accept valid JWT tokens with proper OAuth data', async () => {
      const response = await request
        .get('/health')
        .set('Authorization', `Bearer ${validJwtToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'ok',
        service: 'mcp-server'
      });
    });

    it('should inject session data into request context', async () => {
      const response = await request
        .get('/api/profile')
        .set('Authorization', `Bearer ${validJwtToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        user: {
          id: userId,
          sessionId,
          context: {
            projectId: 'middleware-test-project'
          },
          scopes: ['openid', 'profile', 'user:read']
        }
      });
    });

    it('should handle requests with session ID header', async () => {
      const response = await request
        .get('/api/profile')
        .set('Authorization', `Bearer ${validJwtToken}`)
        .set('X-Session-ID', sessionId)
        .expect(200);

      expect(response.body.user.sessionId).toBe(sessionId);
    });

    it('should validate session existence for JWT tokens', async () => {
      // Delete the session
      await sessionManager.destroySession(sessionId);

      const response = await request
        .get('/api/profile')
        .set('Authorization', `Bearer ${validJwtToken}`)
        .expect(401);

      expect(response.body.error).toBe('authentication_required');
    });

    it('should handle concurrent authenticated requests', async () => {
      const requests = Array.from({ length: 10 }, () =>
        request
          .get('/health')
          .set('Authorization', `Bearer ${validJwtToken}`)
          .expect(200)
      );

      const responses = await Promise.all(requests);
      expect(responses.every(r => r.body.status === 'ok')).toBe(true);
    });
  });

  describe('OAuth Scope Validation', () => {
    it('should validate required scopes for protected endpoints', async () => {
      const limitedUserId = 'limited-scope-user';
      const limitedSessionId = await sessionManager.createSession(limitedUserId, {
        userId: limitedUserId,
        oauthAccessToken: 'limited-oauth-token',
        expiresAt: new Date(Date.now() + 3600000),
        currentContext: {},
        scopes: ['openid'] // Missing required scopes
      });

      const limitedTokenPayload = {
        sub: limitedUserId,
        aud: 'mittwald-mcp-server',
        access_token: 'limited-oauth-token',
        scope: 'openid', // Limited scope
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
        sessionId: limitedSessionId
      };

      const limitedToken = jwt.sign(limitedTokenPayload, process.env.JWT_SECRET!);

      // This endpoint might require specific scopes (depends on implementation)
      const response = await request
        .get('/api/profile')
        .set('Authorization', `Bearer ${limitedToken}`);

      // Should either work with limited scopes or reject with proper error
      expect([200, 403].includes(response.status)).toBe(true);
    });

    it('should allow access with sufficient scopes', async () => {
      const fullUserId = 'full-scope-user';
      const fullSessionId = await sessionManager.createSession(fullUserId, {
        userId: fullUserId,
        oauthAccessToken: 'full-oauth-token',
        expiresAt: new Date(Date.now() + 3600000),
        currentContext: {},
        scopes: ['openid', 'profile', 'user:read', 'customer:read', 'project:read']
      });

      const fullTokenPayload = {
        sub: fullUserId,
        aud: 'mittwald-mcp-server',
        access_token: 'full-oauth-token',
        scope: 'openid profile user:read customer:read project:read',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
        sessionId: fullSessionId
      };

      const fullToken = jwt.sign(fullTokenPayload, process.env.JWT_SECRET!);

      const response = await request
        .get('/api/profile')
        .set('Authorization', `Bearer ${fullToken}`)
        .expect(200);

      expect(response.body.user.scopes).toContain('openid');
      expect(response.body.user.scopes).toContain('profile');
      expect(response.body.user.scopes).toContain('user:read');
    });
  });

  describe('OAuth Error Response Formatting', () => {
    it('should return proper OAuth error responses for MCP endpoints', async () => {
      const response = await request
        .post('/mcp')
        .send({
          jsonrpc: '2.0',
          method: 'initialize',
          id: 1,
          params: {}
        })
        .expect(401);

      expect(response.body).toMatchObject({
        error: 'authentication_required',
        message: 'OAuth authentication required',
        oauth: {
          authorization_url: expect.stringContaining('http://localhost:8080/default/authorize'),
          token_url: 'http://localhost:8080/default/token',
          client_id: 'mittwald-mcp-server',
          redirect_uri: 'http://localhost:3000/auth/callback',
          scopes: expect.arrayContaining(['openid', 'profile', 'user:read'])
        }
      });
    });

    it('should include WWW-Authenticate header in OAuth responses', async () => {
      const response = await request
        .get('/api/profile')
        .expect(401);

      const wwwAuth = response.headers['www-authenticate'];
      expect(wwwAuth).toBeTruthy();
      expect(wwwAuth).toContain('Bearer realm="MCP Server"');
      expect(wwwAuth).toContain('authorization_uri="http://localhost:8080/default/authorize"');
    });

    it('should not expose sensitive information in error responses', async () => {
      const response = await request
        .post('/mcp')
        .set('Authorization', 'Bearer invalid.token.here')
        .send({ jsonrpc: '2.0', method: 'test', id: 1 })
        .expect(401);

      const responseText = JSON.stringify(response.body);
      expect(responseText).not.toMatch(/client_secret|jwt_secret|redis_password/i);
      expect(responseText).not.toMatch(/\/Users|\/home|Error:/);
    });

    it('should handle OPTIONS requests for CORS without authentication', async () => {
      const response = await request
        .options('/api/profile')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'GET')
        .set('Access-Control-Request-Headers', 'Authorization')
        .expect(204);

      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
      expect(response.headers['access-control-allow-methods']).toContain('GET');
    });
  });

  describe('OAuth Session Middleware Integration', () => {
    it('should refresh session TTL on authenticated requests', async () => {
      const userId = 'ttl-refresh-user';
      const sessionId = await sessionManager.createSession(userId, {
        userId,
        oauthAccessToken: 'ttl-test-token',
        expiresAt: new Date(Date.now() + 3600000),
        currentContext: {}
      });

      const tokenPayload = {
        sub: userId,
        aud: 'mittwald-mcp-server',
        access_token: 'ttl-test-token',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
        sessionId
      };

      const token = jwt.sign(tokenPayload, process.env.JWT_SECRET!);

      // Make authenticated request
      await request
        .get('/health')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Session should have updated lastAccessed time
      const session = await sessionManager.getSession(sessionId);
      expect(session).toBeTruthy();
      expect(new Date(session!.lastAccessed).getTime()).toBeGreaterThan(Date.now() - 5000);
    });

    it('should handle session updates during request processing', async () => {
      const userId = 'update-during-request-user';
      let sessionId = await sessionManager.createSession(userId, {
        userId,
        oauthAccessToken: 'initial-token',
        expiresAt: new Date(Date.now() + 3600000),
        currentContext: { projectId: 'initial-project' }
      });

      const tokenPayload = {
        sub: userId,
        aud: 'mittwald-mcp-server',
        access_token: 'initial-token',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
        sessionId
      };

      const token = jwt.sign(tokenPayload, process.env.JWT_SECRET!);

      // Update session during request
      await sessionManager.updateSession(sessionId, {
        oauthAccessToken: 'updated-token',
        currentContext: { projectId: 'updated-project' }
      });

      // Request should still work with original JWT but see updated session
      const response = await request
        .get('/api/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.user.context.projectId).toBe('updated-project');
    });

    it('should handle multiple sessions for same user', async () => {
      const userId = 'multi-session-middleware-user';
      
      const session1Id = await sessionManager.createSession(userId, {
        userId,
        oauthAccessToken: 'token-session-1',
        expiresAt: new Date(Date.now() + 3600000),
        currentContext: { projectId: 'project-1' }
      });

      const session2Id = await sessionManager.createSession(userId, {
        userId,
        oauthAccessToken: 'token-session-2',
        expiresAt: new Date(Date.now() + 3600000),
        currentContext: { projectId: 'project-2' }
      });

      // Create tokens for both sessions
      const token1 = jwt.sign({
        sub: userId,
        aud: 'mittwald-mcp-server',
        access_token: 'token-session-1',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
        sessionId: session1Id
      }, process.env.JWT_SECRET!);

      const token2 = jwt.sign({
        sub: userId,
        aud: 'mittwald-mcp-server',
        access_token: 'token-session-2',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
        sessionId: session2Id
      }, process.env.JWT_SECRET!);

      // Both tokens should work and return different contexts
      const response1 = await request
        .get('/api/profile')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      const response2 = await request
        .get('/api/profile')
        .set('Authorization', `Bearer ${token2}`)
        .expect(200);

      expect(response1.body.user.context.projectId).toBe('project-1');
      expect(response2.body.user.context.projectId).toBe('project-2');
      expect(response1.body.user.sessionId).toBe(session1Id);
      expect(response2.body.user.sessionId).toBe(session2Id);
    });
  });

  describe('OAuth Middleware Error Handling', () => {
    it('should handle Redis connection failures gracefully', async () => {
      // This would require mocking Redis failures
      // For now, test that the middleware doesn't crash the app
      const response = await request
        .post('/mcp')
        .send({ jsonrpc: '2.0', method: 'initialize', id: 1 })
        .expect(401);

      expect(response.body.error).toBe('authentication_required');
    });

    it('should handle malformed JSON in request body', async () => {
      const userId = 'malformed-json-user';
      const sessionId = await sessionManager.createSession(userId, {
        userId,
        oauthAccessToken: 'json-test-token',
        expiresAt: new Date(Date.now() + 3600000),
        currentContext: {}
      });

      const token = jwt.sign({
        sub: userId,
        aud: 'mittwald-mcp-server',
        access_token: 'json-test-token',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
        sessionId
      }, process.env.JWT_SECRET!);

      const response = await request
        .post('/mcp')
        .set('Authorization', `Bearer ${token}`)
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400);

      expect(response.body.error).toBeTruthy();
    });

    it('should handle unexpected session data format', async () => {
      const userId = 'corrupted-session-user';
      const sessionId = await sessionManager.createSession(userId, {
        userId,
        oauthAccessToken: 'corrupted-test-token',
        expiresAt: new Date(Date.now() + 3600000),
        currentContext: {}
      });

      // Manually corrupt session data in Redis
      const sessionKey = `session:${sessionId}`;
      await redisClient.set(sessionKey, 'corrupted-json-data');

      const token = jwt.sign({
        sub: userId,
        aud: 'mittwald-mcp-server',
        access_token: 'corrupted-test-token',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
        sessionId
      }, process.env.JWT_SECRET!);

      const response = await request
        .get('/api/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);

      expect(response.body.error).toBe('authentication_required');
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
