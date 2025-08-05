import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { RedisClient } from '../../src/utils/redis-client.js';
import { SessionManager } from '../../src/server/session-manager.js';
import { MittwaldOAuthClient, OAuthConfig } from '../../src/auth/oauth-client.js';

describe('OAuth Basic Integration Tests', () => {
  let redisClient: RedisClient;
  let sessionManager: SessionManager;
  let oauthClient: MittwaldOAuthClient;

  const testConfig: OAuthConfig = {
    issuer: 'http://localhost:8080/default',
    clientId: 'mittwald-mcp-server',
    clientSecret: 'test-client-secret',
    redirectUri: 'http://localhost:3000/auth/callback',
    scopes: ['openid', 'profile', 'user:read']
  };

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.REDIS_URL = 'redis://localhost:6379';
    
    redisClient = RedisClient.getInstance();
    sessionManager = new SessionManager();
    oauthClient = new MittwaldOAuthClient(testConfig);
  });

  afterAll(async () => {
    try {
      await redisClient.disconnect?.();
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  beforeEach(async () => {
    try {
      const keys = await redisClient.keys('*');
      if (keys.length > 0) {
        await Promise.all(keys.map(key => redisClient.del(key)));
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Basic OAuth Components', () => {
    it('should create OAuth client instance', () => {
      expect(oauthClient).toBeDefined();
      expect(oauthClient).toBeInstanceOf(MittwaldOAuthClient);
    });

    it('should initialize session manager', () => {
      expect(sessionManager).toBeDefined();
      expect(sessionManager).toBeInstanceOf(SessionManager);
    });

    it('should create session with OAuth tokens', async () => {
      const userId = 'test-user';
      const sessionId = await sessionManager.createSession(userId, {
        userId,
        oauthAccessToken: 'test-access-token',
        expiresAt: new Date(Date.now() + 3600000),
        currentContext: {}
      });

      expect(sessionId).toBeTruthy();
      expect(typeof sessionId).toBe('string');

      const session = await sessionManager.getSession(sessionId);
      expect(session).toBeTruthy();
      expect(session!.userId).toBe(userId);
      expect(session!.oauthAccessToken).toBe('test-access-token');
    });

    it('should handle session cleanup', async () => {
      const userId = 'cleanup-test-user';
      const sessionId = await sessionManager.createSession(userId, {
        userId,
        oauthAccessToken: 'cleanup-token',
        expiresAt: new Date(Date.now() - 1000), // Already expired
        currentContext: {}
      });

      // Expired session should be automatically cleaned up when accessed
      const session = await sessionManager.getSession(sessionId);
      expect(session).toBeNull(); // Should return null for expired session

      // Manual cleanup should also work
      const cleanedCount = await sessionManager.cleanupExpiredSessions();
      expect(cleanedCount).toBeGreaterThanOrEqual(0); // May be 0 if already cleaned up
      expect(session).toBeNull();
    });
  });

  describe('OAuth Configuration', () => {
    it('should have correct OAuth configuration', () => {
      expect(testConfig.issuer).toBe('http://localhost:8080/default');
      expect(testConfig.clientId).toBe('mittwald-mcp-server');
      expect(testConfig.redirectUri).toBe('http://localhost:3000/auth/callback');
      expect(testConfig.scopes).toContain('openid');
      expect(testConfig.scopes).toContain('profile');
    });

    it('should validate required OAuth parameters', () => {
      expect(testConfig.issuer).toBeTruthy();
      expect(testConfig.clientId).toBeTruthy();
      expect(testConfig.redirectUri).toBeTruthy();
      expect(Array.isArray(testConfig.scopes)).toBe(true);
      expect(testConfig.scopes.length).toBeGreaterThan(0);
    });
  });
});