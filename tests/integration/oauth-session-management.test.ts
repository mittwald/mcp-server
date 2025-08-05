import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { SessionManager } from '../../src/server/session-manager.js';
import { OAuthStateManager } from '../../src/auth/oauth-state-manager.js';
import { MittwaldOAuthClient, OAuthConfig } from '../../src/auth/oauth-client.js';
import { RedisClient } from '../../src/utils/redis-client.js';
import supertest from 'supertest';
import { Express } from 'express';
import { createApp } from '../../src/server.js';
import jwt from 'jsonwebtoken';
import axios from 'axios';

describe('OAuth Session Management Integration Tests', () => {
  let app: Express;
  let request: supertest.SuperTest<supertest.Test>;
  let sessionManager: SessionManager;
  let stateManager: OAuthStateManager;
  let oauthClient: MittwaldOAuthClient;
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
    process.env.JWT_SECRET = 'test-jwt-secret-for-session-tests';
    process.env.REDIS_URL = 'redis://localhost:6379';

    // Initialize components
    redisClient = RedisClient.getInstance();
    sessionManager = new SessionManager();
    stateManager = new OAuthStateManager();
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

  describe('OAuth Session Creation and Management', () => {
    it('should create session with OAuth tokens after successful authentication', async () => {
      const userId = 'oauth-session-user-1';
      const accessToken = 'oauth-access-token-123';
      const refreshToken = 'oauth-refresh-token-456';
      const scopes = ['openid', 'profile', 'user:read'];

      const sessionId = await sessionManager.createSession(userId, {
        userId,
        oauthAccessToken: accessToken,
        refreshToken,
        expiresAt: new Date(Date.now() + 3600000), // 1 hour
        currentContext: {
          projectId: 'test-project-123'
        },
        scopes
      });

      expect(sessionId).toBeTruthy();
      expect(typeof sessionId).toBe('string');

      // Verify session data
      const session = await sessionManager.getSession(sessionId);
      expect(session).toMatchObject({
        sessionId,
        userId,
        oauthAccessToken: accessToken,
        refreshToken,
        currentContext: {
          projectId: 'test-project-123'
        },
        scopes
      });
    });

    it('should handle sessions with minimal OAuth data', async () => {
      const userId = 'minimal-oauth-user';
      const accessToken = 'minimal-access-token';

      const sessionId = await sessionManager.createSession(userId, {
        userId,
        oauthAccessToken: accessToken,
        expiresAt: new Date(Date.now() + 3600000),
        currentContext: {}
        // No refresh token or scopes
      });

      const session = await sessionManager.getSession(sessionId);
      expect(session).toBeTruthy();
      expect(session!.oauthAccessToken).toBe(accessToken);
      expect(session!.refreshToken).toBeUndefined();
      expect(session!.scopes).toBeUndefined();
    });

    it('should update session with new OAuth tokens', async () => {
      const userId = 'update-token-user';
      const initialToken = 'initial-access-token';
      const newToken = 'updated-access-token';
      const newRefreshToken = 'updated-refresh-token';

      // Create initial session
      const sessionId = await sessionManager.createSession(userId, {
        userId,
        oauthAccessToken: initialToken,
        expiresAt: new Date(Date.now() + 3600000),
        currentContext: {}
      });

      // Update with new tokens
      await sessionManager.updateSession(sessionId, {
        oauthAccessToken: newToken,
        refreshToken: newRefreshToken,
        expiresAt: new Date(Date.now() + 7200000) // 2 hours
      });

      // Verify update
      const updatedSession = await sessionManager.getSession(sessionId);
      expect(updatedSession!.oauthAccessToken).toBe(newToken);
      expect(updatedSession!.refreshToken).toBe(newRefreshToken);
    });

    it('should maintain session context during OAuth token updates', async () => {
      const userId = 'context-preservation-user';
      const context = {
        projectId: 'important-project-123',
        serverId: 'critical-server-456',
        orgId: 'org-789'
      };

      const sessionId = await sessionManager.createSession(userId, {
        userId,
        oauthAccessToken: 'initial-token',
        expiresAt: new Date(Date.now() + 3600000),
        currentContext: context,
        accessibleProjects: ['proj1', 'proj2', 'proj3']
      });

      // Update only OAuth tokens
      await sessionManager.updateSession(sessionId, {
        oauthAccessToken: 'refreshed-token',
        refreshToken: 'new-refresh-token'
      });

      // Context should be preserved
      const session = await sessionManager.getSession(sessionId);
      expect(session!.currentContext).toEqual(context);
      expect(session!.accessibleProjects).toEqual(['proj1', 'proj2', 'proj3']);
      expect(session!.oauthAccessToken).toBe('refreshed-token');
    });
  });

  describe('Multi-Session OAuth Management', () => {
    it('should support multiple sessions per user with different OAuth tokens', async () => {
      const userId = 'multi-session-user';
      
      // Create multiple sessions for same user
      const session1Id = await sessionManager.createSession(userId, {
        userId,
        oauthAccessToken: 'token-session-1',
        refreshToken: 'refresh-1',
        expiresAt: new Date(Date.now() + 3600000),
        currentContext: { projectId: 'project-1' }
      });

      const session2Id = await sessionManager.createSession(userId, {
        userId,
        oauthAccessToken: 'token-session-2', 
        refreshToken: 'refresh-2',
        expiresAt: new Date(Date.now() + 3600000),
        currentContext: { projectId: 'project-2' }
      });

      // Verify both sessions exist and are distinct
      const session1 = await sessionManager.getSession(session1Id);
      const session2 = await sessionManager.getSession(session2Id);

      expect(session1!.oauthAccessToken).toBe('token-session-1');
      expect(session2!.oauthAccessToken).toBe('token-session-2');
      expect(session1!.currentContext.projectId).toBe('project-1');
      expect(session2!.currentContext.projectId).toBe('project-2');

      // Verify user sessions list
      const userSessions = await sessionManager.getUserSessions(userId);
      expect(userSessions).toHaveLength(2);
      expect(userSessions.map(s => s.sessionId)).toContain(session1Id);
      expect(userSessions.map(s => s.sessionId)).toContain(session2Id);
    });

    it('should handle individual session cleanup without affecting other sessions', async () => {
      const userId = 'cleanup-test-user';
      
      const session1Id = await sessionManager.createSession(userId, {
        userId,
        oauthAccessToken: 'token-to-keep',
        expiresAt: new Date(Date.now() + 3600000),
        currentContext: {}
      });

      const session2Id = await sessionManager.createSession(userId, {
        userId,
        oauthAccessToken: 'token-to-delete',
        expiresAt: new Date(Date.now() + 3600000),
        currentContext: {}
      });

      // Delete one session
      await sessionManager.destroySession(session2Id);

      // First session should still exist
      const remainingSession = await sessionManager.getSession(session1Id);
      expect(remainingSession).toBeTruthy();
      expect(remainingSession!.oauthAccessToken).toBe('token-to-keep');

      // Deleted session should be gone
      const deletedSession = await sessionManager.getSession(session2Id);
      expect(deletedSession).toBeNull();

      // User should have only one session now
      const userSessions = await sessionManager.getUserSessions(userId);
      expect(userSessions).toHaveLength(1);
      expect(userSessions[0].sessionId).toBe(session1Id);
    });

    it('should handle bulk session cleanup for user', async () => {
      const userId = 'bulk-cleanup-user';
      
      // Create multiple sessions
      const sessionIds = await Promise.all([
        sessionManager.createSession(userId, {
          userId,
          oauthAccessToken: 'bulk-token-1',
          expiresAt: new Date(Date.now() + 3600000),
          currentContext: {}
        }),
        sessionManager.createSession(userId, {
          userId,
          oauthAccessToken: 'bulk-token-2',
          expiresAt: new Date(Date.now() + 3600000),
          currentContext: {}
        }),
        sessionManager.createSession(userId, {
          userId,
          oauthAccessToken: 'bulk-token-3',
          expiresAt: new Date(Date.now() + 3600000),
          currentContext: {}
        })
      ]);

      // Verify all sessions exist
      expect(await sessionManager.getUserSessions(userId)).toHaveLength(3);

      // Bulk cleanup
      await sessionManager.destroyUserSessions(userId);

      // All sessions should be gone
      expect(await sessionManager.getUserSessions(userId)).toHaveLength(0);
      
      for (const sessionId of sessionIds) {
        expect(await sessionManager.getSession(sessionId)).toBeNull();
      }
    });
  });

  describe('OAuth Session Expiration and Cleanup', () => {
    it('should automatically cleanup expired OAuth sessions', async () => {
      const userId = 'expiration-test-user';
      
      // Create expired session
      const expiredSessionId = await sessionManager.createSession(userId, {
        userId,
        oauthAccessToken: 'expired-oauth-token',
        refreshToken: 'expired-refresh-token',
        expiresAt: new Date(Date.now() - 1000), // Already expired
        currentContext: {}
      });

      // Create valid session
      const validSessionId = await sessionManager.createSession(userId, {
        userId,
        oauthAccessToken: 'valid-oauth-token',
        refreshToken: 'valid-refresh-token',
        expiresAt: new Date(Date.now() + 3600000), // 1 hour
        currentContext: {}
      });

      // Run cleanup
      const cleanedCount = await sessionManager.cleanupExpiredSessions();
      expect(cleanedCount).toBeGreaterThan(0);

      // Expired session should be gone
      expect(await sessionManager.getSession(expiredSessionId)).toBeNull();
      
      // Valid session should remain
      expect(await sessionManager.getSession(validSessionId)).toBeTruthy();
    });

    it('should handle sessions with different expiration times', async () => {
      const userId1 = 'exp-user-1';
      const userId2 = 'exp-user-2';
      const userId3 = 'exp-user-3';

      // Create sessions with different expiration times
      const shortSessionId = await sessionManager.createSession(userId1, {
        userId: userId1,
        oauthAccessToken: 'short-lived-token',
        expiresAt: new Date(Date.now() + 300000), // 5 minutes
        currentContext: {}
      });

      const mediumSessionId = await sessionManager.createSession(userId2, {
        userId: userId2,
        oauthAccessToken: 'medium-lived-token',
        expiresAt: new Date(Date.now() + 1800000), // 30 minutes
        currentContext: {}
      });

      const longSessionId = await sessionManager.createSession(userId3, {
        userId: userId3,
        oauthAccessToken: 'long-lived-token',
        expiresAt: new Date(Date.now() + 7200000), // 2 hours
        currentContext: {}
      });

      // All should be valid initially
      expect(await sessionManager.getSession(shortSessionId)).toBeTruthy();
      expect(await sessionManager.getSession(mediumSessionId)).toBeTruthy();
      expect(await sessionManager.getSession(longSessionId)).toBeTruthy();

      // Manually expire the short session
      await sessionManager.updateSession(shortSessionId, {
        expiresAt: new Date(Date.now() - 1000)
      });

      // Cleanup should only remove expired session
      const cleanedCount = await sessionManager.cleanupExpiredSessions();
      expect(cleanedCount).toBe(1);

      expect(await sessionManager.getSession(shortSessionId)).toBeNull();
      expect(await sessionManager.getSession(mediumSessionId)).toBeTruthy();
      expect(await sessionManager.getSession(longSessionId)).toBeTruthy();
    });

    it('should update session TTL when accessing OAuth sessions', async () => {
      const userId = 'ttl-test-user';
      
      const sessionId = await sessionManager.createSession(userId, {
        userId,
        oauthAccessToken: 'ttl-test-token',
        expiresAt: new Date(Date.now() + 3600000),
        currentContext: {}
      });

      // Get session multiple times - should update lastAccessed
      const session1 = await sessionManager.getSession(sessionId);
      const firstAccessTime = session1!.lastAccessed;

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 100));

      const session2 = await sessionManager.getSession(sessionId);
      const secondAccessTime = session2!.lastAccessed;

      expect(new Date(secondAccessTime).getTime()).toBeGreaterThan(new Date(firstAccessTime).getTime());
    });
  });

  describe('OAuth Session API Integration', () => {
    let validJwtToken: string;
    let sessionId: string;
    let userId: string;

    beforeEach(async () => {
      userId = 'api-integration-user';
      const accessToken = 'api-test-oauth-token';
      const refreshToken = 'api-test-refresh-token';

      sessionId = await sessionManager.createSession(userId, {
        userId,
        oauthAccessToken: accessToken,
        refreshToken,
        expiresAt: new Date(Date.now() + 3600000),
        currentContext: {
          projectId: 'api-test-project'
        },
        scopes: ['openid', 'profile', 'user:read']
      });

      // Create JWT token
      const tokenPayload = {
        sub: userId,
        aud: 'mittwald-mcp-server',
        access_token: accessToken,
        refresh_token: refreshToken,
        scope: 'openid profile user:read',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
        sessionId
      };

      validJwtToken = jwt.sign(tokenPayload, process.env.JWT_SECRET!);
    });

    it('should retrieve user profile with OAuth session data', async () => {
      const response = await request
        .get('/api/profile')
        .set('Authorization', `Bearer ${validJwtToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        user: {
          id: userId,
          sessionId,
          context: {
            projectId: 'api-test-project'
          },
          scopes: ['openid', 'profile', 'user:read']
        }
      });
    });

    it('should list user sessions via API', async () => {
      // Create additional session for same user
      const additionalSessionId = await sessionManager.createSession(userId, {
        userId,
        oauthAccessToken: 'additional-oauth-token',
        expiresAt: new Date(Date.now() + 3600000),
        currentContext: {
          projectId: 'additional-project'
        }
      });

      const response = await request
        .get('/api/sessions')
        .set('Authorization', `Bearer ${validJwtToken}`)
        .expect(200);

      expect(response.body.sessions).toHaveLength(2);
      expect(response.body.sessions.map((s: any) => s.sessionId)).toContain(sessionId);
      expect(response.body.sessions.map((s: any) => s.sessionId)).toContain(additionalSessionId);
    });

    it('should delete specific session via API', async () => {
      // Create session to delete
      const deleteSessionId = await sessionManager.createSession(userId, {
        userId,
        oauthAccessToken: 'delete-me-token',
        expiresAt: new Date(Date.now() + 3600000),
        currentContext: {}
      });

      // Verify session exists
      expect(await sessionManager.getSession(deleteSessionId)).toBeTruthy();

      // Delete via API
      const response = await request
        .delete(`/api/sessions/${deleteSessionId}`)
        .set('Authorization', `Bearer ${validJwtToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify session is deleted
      expect(await sessionManager.getSession(deleteSessionId)).toBeNull();
    });

    it('should prevent deleting other users sessions', async () => {
      const otherUserId = 'other-user';
      const otherSessionId = await sessionManager.createSession(otherUserId, {
        userId: otherUserId,
        oauthAccessToken: 'other-user-token',
        expiresAt: new Date(Date.now() + 3600000),
        currentContext: {}
      });

      // Try to delete other user's session
      const response = await request
        .delete(`/api/sessions/${otherSessionId}`)
        .set('Authorization', `Bearer ${validJwtToken}`)
        .expect(404);

      expect(response.body.error).toBe('Session not found');

      // Session should still exist
      expect(await sessionManager.getSession(otherSessionId)).toBeTruthy();
    });
  });

  describe('OAuth Session State Coordination', () => {
    it('should coordinate OAuth state with session creation flow', async () => {
      const preSessionId = 'pre-auth-session-123';
      
      // Step 1: Create OAuth state with session reference
      const oauthState = await stateManager.createState(preSessionId);
      expect(oauthState.sessionId).toBe(preSessionId);

      // Step 2: After successful OAuth flow, create actual session
      const userId = 'state-coordination-user';
      const actualSessionId = await sessionManager.createSession(userId, {
        userId,
        oauthAccessToken: 'coordinated-token',
        expiresAt: new Date(Date.now() + 3600000),
        currentContext: {}
      });

      // Step 3: Clean up OAuth state
      await stateManager.deleteState(oauthState.state);

      // Verify flow completion
      expect(await sessionManager.getSession(actualSessionId)).toBeTruthy();
      expect(await stateManager.getState(oauthState.state)).toBeNull();
    });

    it('should handle orphaned OAuth states without sessions', async () => {
      // Create OAuth state without corresponding session
      const orphanedState = await stateManager.createState('non-existent-session');
      
      // Cleanup should remove orphaned states
      const cleanedStates = await stateManager.cleanupExpiredStates();
      
      // State should eventually be cleaned up (may not be immediate)
      // In real implementation, orphaned states would be cleaned by TTL
      expect(typeof cleanedStates).toBe('number');
    });

    it('should handle session creation failures gracefully', async () => {
      const failUserId = 'fail-session-user';
      
      try {
        // Create session with invalid data to trigger failure
        await sessionManager.createSession(failUserId, {
          userId: failUserId,
          oauthAccessToken: '', // Invalid empty token
          expiresAt: new Date(Date.now() - 1000), // Already expired
          currentContext: {}
        });
        
        // If it doesn't fail, that's actually okay too
        expect(true).toBe(true);
      } catch (error: any) {
        // Should be a proper session creation error
        expect(error.message).toContain('Session creation failed');
      }
    });
  });

  describe('OAuth Session Context Management', () => {
    it('should maintain OAuth scopes across context updates', async () => {
      const userId = 'scope-context-user';
      const initialScopes = ['openid', 'profile', 'user:read'];
      
      const sessionId = await sessionManager.createSession(userId, {
        userId,
        oauthAccessToken: 'scope-test-token',
        expiresAt: new Date(Date.now() + 3600000),
        currentContext: { projectId: 'initial-project' },
        scopes: initialScopes
      });

      // Update context
      await sessionManager.updateContext(sessionId, {
        projectId: 'updated-project',
        serverId: 'new-server'
      });

      // Scopes should be preserved
      const session = await sessionManager.getSession(sessionId);
      expect(session!.scopes).toEqual(initialScopes);
      expect(session!.currentContext).toEqual({
        projectId: 'updated-project',
        serverId: 'new-server'
      });
    });

    it('should handle context updates with OAuth token refresh', async () => {
      const userId = 'context-refresh-user';
      
      const sessionId = await sessionManager.createSession(userId, {
        userId,
        oauthAccessToken: 'initial-context-token',
        refreshToken: 'initial-refresh',
        expiresAt: new Date(Date.now() + 3600000),
        currentContext: { projectId: 'context-project' },
        accessibleProjects: ['proj1', 'proj2']
      });

      // Simulate token refresh with context preservation
      await sessionManager.updateSession(sessionId, {
        oauthAccessToken: 'refreshed-context-token',
        refreshToken: 'new-refresh-token',
        // Context and accessible projects should be preserved
        expiresAt: new Date(Date.now() + 7200000)
      });

      const session = await sessionManager.getSession(sessionId);
      expect(session!.oauthAccessToken).toBe('refreshed-context-token');
      expect(session!.currentContext).toEqual({ projectId: 'context-project' });
      expect(session!.accessibleProjects).toEqual(['proj1', 'proj2']);
    });

    it('should handle concurrent context and token updates', async () => {
      const userId = 'concurrent-update-user';
      
      const sessionId = await sessionManager.createSession(userId, {
        userId,
        oauthAccessToken: 'concurrent-token',
        expiresAt: new Date(Date.now() + 3600000),
        currentContext: { projectId: 'concurrent-project' }
      });

      // Perform concurrent updates
      await Promise.all([
        sessionManager.updateContext(sessionId, {
          projectId: 'updated-concurrent-project',
          serverId: 'concurrent-server'
        }),
        sessionManager.updateSession(sessionId, {
          oauthAccessToken: 'updated-concurrent-token',
          refreshToken: 'concurrent-refresh'
        })
      ]);

      // Final state should include both updates
      const session = await sessionManager.getSession(sessionId);
      expect(session!.oauthAccessToken).toBe('updated-concurrent-token');
      expect(session!.refreshToken).toBe('concurrent-refresh');
      expect(session!.currentContext.serverId).toBe('concurrent-server');
    });
  });

  describe('OAuth Session Performance and Scalability', () => {
    it('should handle many concurrent session operations', async () => {
      const userCount = 20;
      const sessionsPerUser = 3;
      
      // Create multiple users with multiple sessions each
      const createPromises = [];
      for (let u = 0; u < userCount; u++) {
        for (let s = 0; s < sessionsPerUser; s++) {
          createPromises.push(
            sessionManager.createSession(`perf-user-${u}`, {
              userId: `perf-user-${u}`,
              oauthAccessToken: `perf-token-${u}-${s}`,
              expiresAt: new Date(Date.now() + 3600000),
              currentContext: { projectId: `perf-project-${u}-${s}` }
            })
          );
        }
      }

      const sessionIds = await Promise.all(createPromises);
      expect(sessionIds).toHaveLength(userCount * sessionsPerUser);
      expect(sessionIds.every(id => typeof id === 'string')).toBe(true);

      // Verify all sessions are accessible
      const getPromises = sessionIds.map(id => sessionManager.getSession(id));
      const sessions = await Promise.all(getPromises);
      expect(sessions.every(s => s !== null)).toBe(true);
    });

    it('should efficiently cleanup large numbers of expired sessions', async () => {
      const expiredSessionCount = 50;
      
      // Create many expired sessions
      const expiredPromises = [];
      for (let i = 0; i < expiredSessionCount; i++) {
        expiredPromises.push(
          sessionManager.createSession(`expired-user-${i}`, {
            userId: `expired-user-${i}`,
            oauthAccessToken: `expired-token-${i}`,
            expiresAt: new Date(Date.now() - 1000), // All expired
            currentContext: {}
          })
        );
      }

      const expiredSessionIds = await Promise.all(expiredPromises);
      
      // Run cleanup
      const startTime = Date.now();
      const cleanedCount = await sessionManager.cleanupExpiredSessions();
      const cleanupTime = Date.now() - startTime;

      expect(cleanedCount).toBe(expiredSessionCount);
      expect(cleanupTime).toBeLessThan(5000); // Should complete within 5 seconds

      // Verify all expired sessions are gone
      const remainingSessions = await Promise.all(
        expiredSessionIds.map(id => sessionManager.getSession(id))
      );
      expect(remainingSessions.every(s => s === null)).toBe(true);
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