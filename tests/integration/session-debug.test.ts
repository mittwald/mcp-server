import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { RedisClient } from '../../src/utils/redis-client.js';
import { SessionManager } from '../../src/server/session-manager.js';

describe('Session Manager Debug Tests', () => {
  let redisClient: RedisClient;
  let sessionManager: SessionManager;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.REDIS_URL = 'redis://localhost:6379';
    
    redisClient = RedisClient.getInstance();
    sessionManager = new SessionManager();
    
    // Verify Redis is working
    const pong = await redisClient.ping();
    console.log('Redis ping:', pong);
  });

  afterAll(async () => {
    try {
      await redisClient.disconnect?.();
    } catch (error) {
      console.log('Cleanup error (ignored):', error);
    }
  });

  beforeEach(async () => {
    try {
      // Clean up any existing test data
      const keys = await redisClient.keys('test:*');
      if (keys.length > 0) {
        for (const key of keys) {
          await redisClient.del(key);
        }
      }
    } catch (error) {
      console.log('Cleanup error (ignored):', error);
    }
  });

  it('should create a basic session without hanging', async () => {
    const userId = 'debug-user-1';
    const sessionId = await sessionManager.createSession(userId, {
      userId,
      oauthAccessToken: 'debug-token-1',
      expiresAt: new Date(Date.now() + 3600000),
      currentContext: {}
    });

    expect(sessionId).toBeTruthy();
    expect(typeof sessionId).toBe('string');
    
    console.log('Created session:', sessionId);
  });

  it('should retrieve the created session', async () => {
    const userId = 'debug-user-2';
    const sessionId = await sessionManager.createSession(userId, {
      userId,
      oauthAccessToken: 'debug-token-2',
      expiresAt: new Date(Date.now() + 3600000),
      currentContext: {}
    });

    const session = await sessionManager.getSession(sessionId);
    expect(session).toBeTruthy();
    expect(session!.userId).toBe(userId);
    expect(session!.oauthAccessToken).toBe('debug-token-2');
  });

  it('should handle session cleanup one step at a time', async () => {
    // Create an expired session
    const userId = 'debug-expired-user';
    const sessionId = await sessionManager.createSession(userId, {
      userId,
      oauthAccessToken: 'debug-expired-token',
      expiresAt: new Date(Date.now() - 1000), // Already expired
      currentContext: {}
    });
    
    console.log('Created expired session:', sessionId);

    // Try to get the session - this might trigger the cleanup
    const session = await sessionManager.getSession(sessionId);
    console.log('Retrieved session (should be null due to expiration):', session ? 'exists' : 'null');
    
    expect(session).toBeNull();
  });

  it('should manually test cleanup without the full method', async () => {
    // Create an expired session
    const userId = 'debug-manual-cleanup';
    const sessionId = await sessionManager.createSession(userId, {
      userId,
      oauthAccessToken: 'debug-manual-token',
      expiresAt: new Date(Date.now() - 1000),
      currentContext: {}
    });

    // Manually check the keys pattern
    const pattern = 'session:*';
    const keys = await redisClient.keys(pattern);
    console.log('Found session keys:', keys);
    
    expect(keys.length).toBeGreaterThan(0);
    
    // Manually check one key
    if (keys.length > 0) {
      const sessionData = await redisClient.get(keys[0]);
      console.log('Session data exists:', !!sessionData);
      
      if (sessionData) {
        const parsed = JSON.parse(sessionData);
        console.log('Session expires at:', parsed.expiresAt);
        console.log('Is expired:', new Date() > new Date(parsed.expiresAt));
      }
    }
  });

  it('should test destroySession method specifically', async () => {
    // Create a session
    const userId = 'debug-destroy-user';
    const sessionId = await sessionManager.createSession(userId, {
      userId,
      oauthAccessToken: 'debug-destroy-token',
      expiresAt: new Date(Date.now() + 3600000),
      currentContext: {}
    });

    console.log('Created session for destroy test:', sessionId);

    // Verify it exists
    let session = await sessionManager.getSession(sessionId);
    expect(session).toBeTruthy();

    // Now destroy it - this is where the hang might occur
    console.log('About to destroy session...');
    await sessionManager.destroySession(sessionId);
    console.log('Session destroyed successfully');

    // Verify it's gone
    session = await sessionManager.getSession(sessionId);
    expect(session).toBeNull();
  });
});