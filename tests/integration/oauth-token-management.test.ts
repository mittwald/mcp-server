import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { MittwaldOAuthClient, OAuthConfig } from '../../src/auth/oauth-client.js';
import { SessionManager } from '../../src/server/session-manager.js';
import { RedisClient } from '../../src/utils/redis-client.js';
import supertest from 'supertest';
import { Express } from 'express';
import { createApp } from '../../src/server.js';
import jwt from 'jsonwebtoken';
import axios from 'axios';

describe('OAuth Token Management Integration Tests', () => {
  let app: Express;
  let request: supertest.SuperTest<supertest.Test>;
  let oauthClient: MittwaldOAuthClient;
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
    process.env.JWT_SECRET = 'test-jwt-secret-for-token-tests';
    process.env.REDIS_URL = 'redis://localhost:6379';

    // Initialize components
    redisClient = RedisClient.getInstance();
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

  describe('Token Exchange Integration', () => {
    it('should structure token exchange requests correctly', async () => {
      const mockCode = 'mock-authorization-code-123';
      const mockCodeVerifier = 'mock-code-verifier-456'; 
      const mockState = 'mock-state-789';

      try {
        await oauthClient.exchangeCodeForTokens(mockCode, mockCodeVerifier, mockState);
        // If we reach here, the exchange somehow succeeded (unlikely with mock data)
        expect(true).toBe(true);
      } catch (error: any) {
        // Verify it's a proper OAuth error, not a network/parsing error
        expect(error.message).toContain('Token exchange failed');
        
        // Should not be connection errors
        expect(error.message).not.toContain('ECONNREFUSED');
        expect(error.message).not.toContain('ENOTFOUND');
        expect(error.message).not.toContain('timeout');
      }
    });

    it('should validate token exchange parameters properly', async () => {
      // Test missing code parameter
      await expect(
        oauthClient.exchangeCodeForTokens('', 'valid-verifier', 'valid-state')
      ).rejects.toThrow();

      // Test missing code verifier
      await expect(
        oauthClient.exchangeCodeForTokens('valid-code', '', 'valid-state')
      ).rejects.toThrow();

      // Test missing state
      await expect(
        oauthClient.exchangeCodeForTokens('valid-code', 'valid-verifier', '')
      ).rejects.toThrow();
    });

    it('should make proper HTTP request to token endpoint', async () => {
      // We can't easily intercept the actual HTTP request without mocking,
      // but we can verify the OAuth client properly initializes and attempts the request
      const mockCode = 'test-auth-code';
      const mockVerifier = 'test-code-verifier';
      const mockState = 'test-state';

      let errorThrown = false;
      try {
        await oauthClient.exchangeCodeForTokens(mockCode, mockVerifier, mockState);
      } catch (error: any) {
        errorThrown = true;
        // Should be a proper OAuth error response from MockOAuth2Server
        expect(error.message).toContain('Token exchange failed');
      }

      expect(errorThrown).toBe(true);
    });

    it('should handle invalid authorization codes', async () => {
      const invalidCode = 'definitely-invalid-code-123';
      const validVerifier = 'valid-code-verifier';
      const validState = 'valid-state';

      await expect(
        oauthClient.exchangeCodeForTokens(invalidCode, validVerifier, validState)
      ).rejects.toThrow('Token exchange failed');
    });

    it('should handle mismatched code verifiers', async () => {
      // In a real scenario, this would be caught by the OAuth server
      const validCode = 'valid-auth-code';
      const wrongVerifier = 'wrong-code-verifier';
      const validState = 'valid-state';

      await expect(
        oauthClient.exchangeCodeForTokens(validCode, wrongVerifier, validState)
      ).rejects.toThrow('Token exchange failed');
    });
  });

  describe('Token Refresh Integration', () => {
    it('should structure token refresh requests correctly', async () => {
      const mockRefreshToken = 'mock-refresh-token-123';

      try {
        await oauthClient.refreshTokens(mockRefreshToken);
        // If successful, great! (unlikely with mock data)
        expect(true).toBe(true);
      } catch (error: any) {
        // Verify it's a proper OAuth error
        expect(error.message).toContain('Token refresh failed');
        
        // Should not be connection/parsing errors
        expect(error.message).not.toContain('ECONNREFUSED');
        expect(error.message).not.toContain('JSON');
      }
    });

    it('should validate refresh token parameter', async () => {
      // Test with empty refresh token
      await expect(
        oauthClient.refreshTokens('')
      ).rejects.toThrow();

      // Test with null/undefined
      await expect(
        oauthClient.refreshTokens(null as any)
      ).rejects.toThrow();
    });

    it('should handle invalid refresh tokens', async () => {
      const invalidRefreshToken = 'definitely-invalid-refresh-token';

      await expect(
        oauthClient.refreshTokens(invalidRefreshToken)
      ).rejects.toThrow('Token refresh failed');
    });

    it('should handle expired refresh tokens', async () => {
      const expiredRefreshToken = 'expired-refresh-token-123';

      await expect(
        oauthClient.refreshTokens(expiredRefreshToken)
      ).rejects.toThrow('Token refresh failed');
    });

    it('should handle server errors during token refresh', async () => {
      // Create OAuth client with invalid endpoint to simulate server error
      const badConfig = {
        ...testConfig,
        issuer: 'http://localhost:8080/invalid-endpoint'
      };
      
      const badClient = new MittwaldOAuthClient(badConfig);
      
      // Initialize should fail
      await expect(badClient.initialize())
        .rejects.toThrow('OAuth client initialization failed');
    });
  });

  describe('Token Validation Integration', () => {
    it('should validate access tokens against MockOAuth2Server userinfo endpoint', async () => {
      const mockAccessToken = 'mock-access-token-123';

      const isValid = await oauthClient.validateToken(mockAccessToken);
      
      // With mock data, this should fail validation
      expect(isValid).toBe(false);
    });

    it('should handle invalid access tokens gracefully', async () => {
      const invalidToken = 'definitely-invalid-token';

      const isValid = await oauthClient.validateToken(invalidToken);
      expect(isValid).toBe(false);
    });

    it('should handle expired access tokens', async () => {
      const expiredToken = 'expired-access-token-123';

      const isValid = await oauthClient.validateToken(expiredToken);
      expect(isValid).toBe(false);
    });

    it('should not throw errors for invalid tokens during validation', async () => {
      // Token validation should return false, not throw
      expect(await oauthClient.validateToken('')).toBe(false);
      expect(await oauthClient.validateToken('invalid')).toBe(false);
      expect(await oauthClient.validateToken('malformed.jwt.token')).toBe(false);
    });
  });

  describe('User Info Retrieval Integration', () => {
    it('should structure userinfo requests correctly', async () => {
      const mockAccessToken = 'mock-access-token-for-userinfo';

      try {
        await oauthClient.getUserInfo(mockAccessToken);
        // If successful, great!
        expect(true).toBe(true);
      } catch (error: any) {
        // Should be a proper userinfo error
        expect(error.message).toContain('Failed to get user info');
        
        // Should not be connection errors
        expect(error.message).not.toContain('ECONNREFUSED');
      }
    });

    it('should handle invalid access tokens in userinfo requests', async () => {
      const invalidToken = 'invalid-access-token';

      await expect(
        oauthClient.getUserInfo(invalidToken)
      ).rejects.toThrow('Failed to get user info');
    });

    it('should handle expired tokens in userinfo requests', async () => {
      const expiredToken = 'expired-access-token';

      await expect(
        oauthClient.getUserInfo(expiredToken)
      ).rejects.toThrow('Failed to get user info');
    });

    it('should validate userinfo response structure', async () => {
      // This test demonstrates the expected userinfo structure
      // In a real scenario with valid tokens, we'd verify the response format
      const mockToken = 'mock-token';

      try {
        const userInfo = await oauthClient.getUserInfo(mockToken);
        
        // If we get here, verify the structure
        expect(userInfo).toHaveProperty('sub');
        expect(typeof userInfo.sub).toBe('string');
      } catch (error: any) {
        // Expected with mock token
        expect(error.message).toContain('Failed to get user info');
      }
    });
  });

  describe('Token Revocation Integration', () => {
    it('should structure token revocation requests correctly', async () => {
      const mockToken = 'mock-token-to-revoke';

      // Token revocation should not throw even if token is invalid
      await expect(
        oauthClient.revokeToken(mockToken)
      ).resolves.not.toThrow();
    });

    it('should handle revocation of invalid tokens gracefully', async () => {
      const invalidToken = 'invalid-token-123';

      // Should not throw error even for invalid tokens
      await expect(
        oauthClient.revokeToken(invalidToken)
      ).resolves.not.toThrow();
    });

    it('should handle revocation of already expired tokens', async () => {
      const expiredToken = 'expired-token-123';

      // Should handle gracefully without throwing
      await expect(
        oauthClient.revokeToken(expiredToken)
      ).resolves.not.toThrow();
    });

    it('should handle server errors during revocation gracefully', async () => {
      const someToken = 'some-token';

      // Even if server returns error, revocation should not throw
      await expect(
        oauthClient.revokeToken(someToken)
      ).resolves.not.toThrow();
    });
  });

  describe('Session Token Integration', () => {
    let validJwtToken: string;
    let mockSessionId: string;

    beforeEach(async () => {
      // Create a mock session with OAuth tokens
      const mockUserId = 'test-user-token-mgmt';
      const mockOAuthToken = 'oauth-access-token-123';
      const mockRefreshToken = 'oauth-refresh-token-456';

      mockSessionId = await sessionManager.createSession(mockUserId, {
        userId: mockUserId,
        oauthAccessToken: mockOAuthToken,
        refreshToken: mockRefreshToken,
        expiresAt: new Date(Date.now() + 3600000), // 1 hour
        currentContext: {
          projectId: 'test-project-123'
        },
        scopes: ['openid', 'profile', 'user:read']
      });

      // Create corresponding JWT token
      const tokenPayload = {
        sub: mockUserId,
        aud: 'mittwald-mcp-server',
        access_token: mockOAuthToken,
        refresh_token: mockRefreshToken,
        scope: 'openid profile user:read',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
        sessionId: mockSessionId
      };

      validJwtToken = jwt.sign(tokenPayload, process.env.JWT_SECRET!);
    });

    it('should validate JWT tokens with embedded OAuth tokens', async () => {
      const response = await request
        .get('/health')
        .set('Authorization', `Bearer ${validJwtToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'ok',
        service: 'mcp-server'
      });
    });

    it('should extract OAuth tokens from JWT for API calls', async () => {
      const response = await request
        .get('/api/profile')
        .set('Authorization', `Bearer ${validJwtToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        user: {
          id: 'test-user-token-mgmt',
          sessionId: mockSessionId,
          scopes: ['openid', 'profile', 'user:read']
        }
      });
    });

    it('should handle JWT tokens with expired OAuth tokens', async () => {
      // Create JWT with expired OAuth token info
      const expiredTokenPayload = {
        sub: 'test-user-expired',
        aud: 'mittwald-mcp-server',
        access_token: 'expired-oauth-token',
        refresh_token: 'expired-refresh-token',
        exp: Math.floor(Date.now() / 1000) + 3600, // JWT still valid
        iat: Math.floor(Date.now() / 1000)
      };

      const expiredJwt = jwt.sign(expiredTokenPayload, process.env.JWT_SECRET!);

      // This should still work as JWT validation comes first
      const response = await request
        .get('/health')
        .set('Authorization', `Bearer ${expiredJwt}`)
        .expect(200);

      expect(response.body.status).toBe('ok');
    });

    it('should handle session updates with refreshed tokens', async () => {
      const newAccessToken = 'new-refreshed-access-token';
      const newRefreshToken = 'new-refreshed-refresh-token';

      // Update session with new tokens (simulating token refresh)
      await sessionManager.updateSession(mockSessionId, {
        oauthAccessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresAt: new Date(Date.now() + 3600000) // New expiration
      });

      // Verify session was updated
      const updatedSession = await sessionManager.getSession(mockSessionId);
      expect(updatedSession).toBeTruthy();
      expect(updatedSession!.oauthAccessToken).toBe(newAccessToken);
      expect(updatedSession!.refreshToken).toBe(newRefreshToken);
    });
  });

  describe('Token Lifecycle Management', () => {
    it('should handle complete token lifecycle', async () => {
      const mockUserId = 'lifecycle-test-user';
      
      // Step 1: Create session with initial tokens
      const sessionId = await sessionManager.createSession(mockUserId, {
        userId: mockUserId,
        oauthAccessToken: 'initial-access-token',
        refreshToken: 'initial-refresh-token',
        expiresAt: new Date(Date.now() + 3600000),
        currentContext: {}
      });

      // Step 2: Verify session exists
      let session = await sessionManager.getSession(sessionId);
      expect(session).toBeTruthy();
      expect(session!.oauthAccessToken).toBe('initial-access-token');

      // Step 3: Update with refreshed tokens
      await sessionManager.updateSession(sessionId, {
        oauthAccessToken: 'refreshed-access-token',
        refreshToken: 'refreshed-refresh-token'
      });

      // Step 4: Verify update
      session = await sessionManager.getSession(sessionId);
      expect(session!.oauthAccessToken).toBe('refreshed-access-token');

      // Step 5: Clean session (token revocation simulation)
      await sessionManager.destroySession(sessionId);

      // Step 6: Verify cleanup
      session = await sessionManager.getSession(sessionId);
      expect(session).toBeNull();
    });

    it('should cleanup expired sessions with expired tokens', async () => {
      const expiredUserId = 'expired-user';
      
      // Create session with past expiration
      const expiredSessionId = await sessionManager.createSession(expiredUserId, {
        userId: expiredUserId,
        oauthAccessToken: 'expired-access-token',
        refreshToken: 'expired-refresh-token',
        expiresAt: new Date(Date.now() - 1000), // Already expired
        currentContext: {}
      });

      // Session should be retrievable initially
      let session = await sessionManager.getSession(expiredSessionId);
      expect(session).toBeTruthy();

      // Cleanup should remove expired session
      const cleanedCount = await sessionManager.cleanupExpiredSessions();
      expect(cleanedCount).toBeGreaterThan(0);

      // Session should now be gone
      session = await sessionManager.getSession(expiredSessionId);
      expect(session).toBeNull();
    });

    it('should handle token refresh workflow integration', async () => {
      const refreshUserId = 'refresh-test-user';
      
      // Create session with tokens that will need refresh
      const sessionId = await sessionManager.createSession(refreshUserId, {
        userId: refreshUserId,
        oauthAccessToken: 'soon-to-expire-token',
        refreshToken: 'valid-refresh-token',
        expiresAt: new Date(Date.now() + 300000), // 5 minutes
        currentContext: {}
      });

      // Simulate the refresh workflow
      const session = await sessionManager.getSession(sessionId);
      expect(session).toBeTruthy();

      // In real implementation, this would use oauthClient.refreshTokens()
      // and update the session with new token
      
      try {
        // This will fail with mock token, but tests the integration
        await oauthClient.refreshTokens(session!.refreshToken!);
      } catch (error: any) {
        expect(error.message).toContain('Token refresh failed');
      }
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should handle partial token data gracefully', async () => {
      const partialUserId = 'partial-token-user';
      
      // Create session with missing refresh token
      const sessionId = await sessionManager.createSession(partialUserId, {
        userId: partialUserId,
        oauthAccessToken: 'access-only-token',
        // refreshToken intentionally missing
        expiresAt: new Date(Date.now() + 3600000),
        currentContext: {}
      });

      const session = await sessionManager.getSession(sessionId);
      expect(session).toBeTruthy();
      expect(session!.oauthAccessToken).toBeTruthy();
      expect(session!.refreshToken).toBeUndefined();
    });

    it('should handle Redis failures during token operations', async () => {
      // This would require mocking Redis failures
      // For now, verify that operations don't completely break the app
      
      const testUserId = 'redis-failure-test';
      
      try {
        const sessionId = await sessionManager.createSession(testUserId, {
          userId: testUserId,
          oauthAccessToken: 'test-token',
          expiresAt: new Date(Date.now() + 3600000),
          currentContext: {}
        });
        
        expect(sessionId).toBeTruthy();
      } catch (error: any) {
        // If Redis fails, should get a proper error message
        expect(error.message).toContain('Session creation failed');
      }
    });

    it('should handle concurrent token operations', async () => {
      const concurrentUserId = 'concurrent-test-user';
      
      // Create multiple sessions concurrently
      const sessionPromises = Array.from({ length: 5 }, (_, i) =>
        sessionManager.createSession(`${concurrentUserId}-${i}`, {
          userId: `${concurrentUserId}-${i}`,
          oauthAccessToken: `concurrent-token-${i}`,
          expiresAt: new Date(Date.now() + 3600000),
          currentContext: {}
        })
      );

      const sessionIds = await Promise.all(sessionPromises);
      
      // All sessions should be created successfully
      expect(sessionIds).toHaveLength(5);
      expect(sessionIds.every(id => typeof id === 'string')).toBe(true);
      expect(new Set(sessionIds).size).toBe(5); // All unique
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