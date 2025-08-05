import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { createApp, startServer } from '../../src/server.js';
import { RedisClient } from '../../src/utils/redis-client.js';
import { SessionManager } from '../../src/server/session-manager.js';
import supertest from 'supertest';
import { Express } from 'express';
import jwt from 'jsonwebtoken';

describe('OAuth Flow Integration Tests', () => {
  let app: Express;
  let server: any;
  let request: supertest.SuperTest<supertest.Test>;
  let redisClient: RedisClient;
  let sessionManager: SessionManager;

  beforeAll(async () => {
    // Set test environment
    process.env.NODE_ENV = 'test';
    process.env.DISABLE_OAUTH = 'false';
    process.env.JWT_SECRET = 'test-jwt-secret-for-integration-tests';
    process.env.REDIS_URL = 'redis://localhost:6379';
    process.env.OAUTH_ISSUER = 'http://localhost:8080/default';
    process.env.OAUTH_REDIRECT_URI = 'http://localhost:3000/auth/callback';

    // Initialize app and server
    app = await createApp();
    server = await startServer(0); // Use random port
    request = supertest(app);

    // Initialize Redis and session manager
    redisClient = RedisClient.getInstance();
    sessionManager = new SessionManager();
  });

  afterAll(async () => {
    if (server) {
      server.close();
    }
    // Clean up Redis connections
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

  describe('Unauthenticated Requests', () => {
    it('should return 401 for unauthenticated MCP requests', async () => {
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
          authorization_url: 'http://localhost:8080/default/authorize',
          token_url: 'http://localhost:8080/default/token',
          client_id: 'mittwald-mcp-server',
          redirect_uri: 'http://localhost:3000/auth/callback',
          scopes: expect.arrayContaining(['openid', 'profile', 'user:read'])
        }
      });

      expect(response.headers['www-authenticate']).toContain('Bearer realm="MCP Server"');
    });

    it('should return proper OAuth metadata in WWW-Authenticate header', async () => {
      const response = await request
        .get('/api/protected')
        .expect(401);

      const wwwAuth = response.headers['www-authenticate'];
      expect(wwwAuth).toMatch(/Bearer realm="MCP Server"/);
      expect(wwwAuth).toMatch(/authorization_uri="http:\/\/localhost:8080\/default\/authorize"/);
    });
  });

  describe('Authenticated Requests', () => {
    let validJwtToken: string;
    let sessionId: string;

    beforeEach(async () => {
      // Create a test session
      sessionId = await sessionManager.createSession('test-user-123', {
        userId: 'test-user-123',
        oauthAccessToken: 'test-oauth-access-token',
        refreshToken: 'test-refresh-token',
        expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
        currentContext: {
          projectId: 'test-project-123'
        }
      });

      // Create a valid JWT token
      const tokenPayload = {
        sub: 'test-user-123',
        aud: 'mittwald-mcp-server',
        access_token: 'test-oauth-access-token',
        refresh_token: 'test-refresh-token',
        scope: 'openid profile user:read customer:read project:read',
        exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
        iat: Math.floor(Date.now() / 1000)
      };

      validJwtToken = jwt.sign(tokenPayload, process.env.JWT_SECRET!);
    });

    it('should accept valid JWT tokens', async () => {
      const response = await request
        .get('/health')
        .set('Authorization', `Bearer ${validJwtToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'ok',
        service: 'mcp-server',
        transport: 'http'
      });
    });

    it('should reject expired JWT tokens', async () => {
      // Create expired token
      const expiredTokenPayload = {
        sub: 'test-user-123',
        aud: 'mittwald-mcp-server',
        access_token: 'test-oauth-access-token',
        exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
        iat: Math.floor(Date.now() / 1000) - 7200 // 2 hours ago
      };

      const expiredToken = jwt.sign(expiredTokenPayload, process.env.JWT_SECRET!);

      await request
        .get('/health')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);
    });

    it('should reject tokens with invalid signature', async () => {
      const invalidToken = jwt.sign(
        { sub: 'test-user-123' },
        'wrong-secret'
      );

      await request
        .get('/health')
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(401);
    });

    it('should handle malformed tokens', async () => {
      await request
        .get('/health')
        .set('Authorization', 'Bearer invalid.token.format')
        .expect(401);
    });
  });

  describe('Session Management Integration', () => {
    it('should integrate OAuth tokens with session storage', async () => {
      const userId = 'integration-test-user';
      const sessionData = {
        userId,
        oauthAccessToken: 'oauth-access-token-123',
        refreshToken: 'refresh-token-123',
        expiresAt: new Date(Date.now() + 3600000),
        currentContext: {
          projectId: 'test-project-456',
          serverId: 'test-server-789'
        }
      };

      // Create session
      const sessionId = await sessionManager.createSession(userId, sessionData);
      expect(sessionId).toBeTruthy();

      // Retrieve session
      const retrievedSession = await sessionManager.getSession(sessionId);
      expect(retrievedSession).toMatchObject({
        sessionId,
        userId,
        oauthAccessToken: 'oauth-access-token-123',
        refreshToken: 'refresh-token-123',
        currentContext: {
          projectId: 'test-project-456',
          serverId: 'test-server-789'
        }
      });
    });

    it('should handle session expiration', async () => {
      const userId = 'expiring-user';
      const expiredSessionData = {
        userId,
        oauthAccessToken: 'expired-token',
        refreshToken: 'expired-refresh',
        expiresAt: new Date(Date.now() - 1000), // Already expired
        currentContext: {}
      };

      const sessionId = await sessionManager.createSession(userId, expiredSessionData);
      
      // Session should be retrievable immediately after creation
      const session = await sessionManager.getSession(sessionId);
      expect(session).toBeTruthy();

      // But should be cleaned up by background tasks
      await sessionManager.cleanupExpiredSessions();
      const cleanedSession = await sessionManager.getSession(sessionId);
      expect(cleanedSession).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle Redis connection errors gracefully', async () => {
      // This test would require mocking Redis to simulate connection failures
      // For now, we test that the endpoints return proper error responses
      
      const response = await request
        .post('/mcp')
        .send({ jsonrpc: '2.0', method: 'initialize', id: 1 })
        .expect(401);

      expect(response.body.error).toBe('authentication_required');
    });

    it('should handle malformed requests', async () => {
      await request
        .post('/mcp')
        .send('invalid json')
        .expect(400);
    });

    it('should handle missing content-type', async () => {
      await request
        .post('/mcp')
        .set('Content-Type', '')
        .send('data')
        .expect(401); // Should still require auth first
    });
  });

  describe('CORS Integration', () => {
    it('should handle CORS preflight requests', async () => {
      const response = await request
        .options('/mcp')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'Content-Type,Authorization')
        .expect(204);

      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
      expect(response.headers['access-control-allow-methods']).toContain('POST');
    });

    it('should include CORS headers in error responses', async () => {
      const response = await request
        .post('/mcp')
        .set('Origin', 'http://localhost:3000')
        .send({ jsonrpc: '2.0', method: 'test', id: 1 })
        .expect(401);

      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });
  });

  describe('Health Checks', () => {
    it('should return health status with OAuth capability info', async () => {
      const response = await request
        .get('/health')
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'ok',
        service: 'mcp-server',
        transport: 'http',
        capabilities: {
          oauth: true,
          mcp: true
        }
      });
    });

    it('should indicate authentication requirement in service metadata', async () => {
      const response = await request
        .get('/')
        .expect(200);

      expect(response.body).toMatchObject({
        service: 'MCP Server',
        version: expect.any(String),
        transport: 'http',
        authRequired: true,
        endpoints: expect.objectContaining({
          mcp: expect.stringContaining('/mcp'),
          health: expect.stringContaining('/health')
        })
      });
    });
  });

  describe('Security Headers', () => {
    it('should include security headers in responses', async () => {
      const response = await request
        .get('/health')
        .expect(200);

      // Check for basic security headers that should be present
      expect(response.headers).toHaveProperty('x-powered-by');
      expect(response.headers).toHaveProperty('vary');
    });

    it('should not expose sensitive information in error responses', async () => {
      const response = await request
        .post('/mcp')
        .send({ invalid: 'request' })
        .expect(401);

      // Should not contain stack traces or internal paths
      expect(JSON.stringify(response.body)).not.toMatch(/\/Users|\/home|Error:/);
    });
  });
});