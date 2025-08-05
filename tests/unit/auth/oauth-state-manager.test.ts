import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OAuthStateManager } from '../../../src/auth/oauth-state-manager.js';

// Mock Redis client
vi.mock('../../../src/utils/redis-client.js', () => ({
  redisClient: {
    set: vi.fn(),
    get: vi.fn(),
    del: vi.fn(),
    keys: vi.fn()
  }
}));

// Mock logger
vi.mock('../../../src/utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  }
}));

// Mock openid-client for state generation
vi.mock('openid-client', () => ({
  randomState: vi.fn(() => 'mock-random-state'),
  randomPKCECodeVerifier: vi.fn(() => 'mock-code-verifier'),
  calculatePKCECodeChallenge: vi.fn(() => Promise.resolve('mock-code-challenge'))
}));

const mockOpenidClient = vi.hoisted(() => ({
  randomState: vi.fn(() => 'mock-random-state'),
  randomPKCECodeVerifier: vi.fn(() => 'mock-code-verifier'), 
  calculatePKCECodeChallenge: vi.fn(() => Promise.resolve('mock-code-challenge'))
}));

describe('OAuthStateManager', () => {
  let stateManager: OAuthStateManager;
  let mockRedisClient: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Import and mock the redis client
    const { redisClient } = await import('../../../src/utils/redis-client.js');
    mockRedisClient = redisClient;
    
    mockRedisClient.set = vi.fn();
    mockRedisClient.get = vi.fn();
    mockRedisClient.del = vi.fn();
    mockRedisClient.keys = vi.fn();
    
    stateManager = new OAuthStateManager();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createState', () => {
    it('should create and store OAuth state with PKCE data', async () => {
      const sessionId = 'session-123';

      mockRedisClient.set.mockResolvedValue('OK');

      const result = await stateManager.createState(sessionId);

      expect(result).toMatchObject({
        state: 'mock-random-state',
        codeVerifier: 'mock-code-verifier',
        codeChallenge: 'mock-code-challenge',
        sessionId: sessionId,
        createdAt: expect.any(Date),
        expiresAt: expect.any(Date)
      });

      expect(mockRedisClient.set).toHaveBeenCalledWith(
        `oauth_state:mock-random-state`,
        expect.any(String),
        600 // 10 minutes TTL
      );
    });

    it('should handle Redis storage errors', async () => {
      const sessionId = 'session-123';
      const error = new Error('Redis connection failed');

      mockRedisClient.set.mockRejectedValue(error);

      await expect(stateManager.createState(sessionId))
        .rejects.toThrow(error);
    });
  });

  describe('getState', () => {
    it('should get valid OAuth state', async () => {
      const state = 'valid-state';
      const storedData = {
        state: 'valid-state',
        sessionId: 'session-123',
        codeVerifier: 'code-verifier-123',
        codeChallenge: 'code-challenge-123',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 600000).toISOString()
      };

      mockRedisClient.get.mockResolvedValue(JSON.stringify(storedData));

      const result = await stateManager.getState(state);

      expect(result).toMatchObject({
        state: 'valid-state',
        sessionId: 'session-123',
        codeVerifier: 'code-verifier-123'
      });

      expect(mockRedisClient.get).toHaveBeenCalledWith(`oauth_state:${state}`);
    });

    it('should return null for non-existent state', async () => {
      const state = 'non-existent-state';

      mockRedisClient.get.mockResolvedValue(null);

      const result = await stateManager.getState(state);

      expect(result).toBeNull();
    });

    it('should return null for expired state', async () => {
      const state = 'expired-state';
      const expiredDate = new Date(Date.now() - 15 * 60 * 1000); // 15 minutes ago
      const storedData = {
        sessionId: 'session-123',
        codeVerifier: 'code-verifier-123',
        createdAt: expiredDate.toISOString()
      };

      mockRedisClient.get.mockResolvedValue(JSON.stringify(storedData));
      mockRedisClient.del.mockResolvedValue(1);

      const result = await stateManager.validateAndConsumeState(state);

      expect(result).toBeNull();
      expect(mockRedisClient.del).toHaveBeenCalledWith(`oauth:state:${state}`);
    });

    it('should handle malformed stored data', async () => {
      const state = 'malformed-state';

      mockRedisClient.get.mockResolvedValue('invalid-json');

      const result = await stateManager.validateAndConsumeState(state);

      expect(result).toBeNull();
    });

    it('should handle Redis retrieval errors', async () => {
      const state = 'error-state';
      const error = new Error('Redis connection failed');

      mockRedisClient.get.mockRejectedValue(error);

      await expect(stateManager.validateAndConsumeState(state))
        .rejects.toThrow('Failed to validate OAuth state: Redis connection failed');
    });
  });

  describe('cleanupExpiredStates', () => {
    it('should clean up expired OAuth states', async () => {
      const expiredStates = ['oauth:state:expired1', 'oauth:state:expired2'];
      const validStates = ['oauth:state:valid1'];
      const allStates = [...expiredStates, ...validStates];

      // Mock expired data
      const expiredData = {
        sessionId: 'session-123',
        codeVerifier: 'code-verifier',
        createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString() // 15 minutes ago
      };

      // Mock valid data
      const validData = {
        sessionId: 'session-456',
        codeVerifier: 'code-verifier',
        createdAt: new Date().toISOString() // Now
      };

      mockRedisClient.keys.mockResolvedValue(allStates);
      
      // Mock get calls for each state
      mockRedisClient.get.mockImplementation((key: string) => {
        if (expiredStates.includes(key)) {
          return Promise.resolve(JSON.stringify(expiredData));
        } else if (validStates.includes(key)) {
          return Promise.resolve(JSON.stringify(validData));
        }
        return Promise.resolve(null);
      });

      mockRedisClient.del.mockResolvedValue(1);

      const cleanedCount = await stateManager.cleanupExpiredStates();

      expect(cleanedCount).toBe(2);
      expect(mockRedisClient.keys).toHaveBeenCalledWith('oauth:state:*');
      expect(mockRedisClient.del).toHaveBeenCalledTimes(2);
      expect(mockRedisClient.del).toHaveBeenCalledWith('oauth:state:expired1');
      expect(mockRedisClient.del).toHaveBeenCalledWith('oauth:state:expired2');
    });

    it('should handle cleanup errors gracefully', async () => {
      const error = new Error('Redis cleanup failed');
      mockRedisClient.keys.mockRejectedValue(error);

      await expect(stateManager.cleanupExpiredStates())
        .rejects.toThrow('Failed to cleanup expired OAuth states: Redis cleanup failed');
    });

    it('should return 0 when no states exist', async () => {
      mockRedisClient.keys.mockResolvedValue([]);

      const cleanedCount = await stateManager.cleanupExpiredStates();

      expect(cleanedCount).toBe(0);
    });
  });

  describe('isStateExpired', () => {
    it('should correctly identify expired states', () => {
      const expiredDate = new Date(Date.now() - 15 * 60 * 1000); // 15 minutes ago
      const validDate = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes ago

      expect((stateManager as any).isStateExpired(expiredDate.toISOString())).toBe(true);
      expect((stateManager as any).isStateExpired(validDate.toISOString())).toBe(false);
    });

    it('should handle invalid date strings', () => {
      expect((stateManager as any).isStateExpired('invalid-date')).toBe(true);
    });
  });

  describe('state format validation', () => {
    it('should validate state data structure', async () => {
      const validStateData = {
        sessionId: 'session-123',
        codeVerifier: 'code-verifier-123',
        createdAt: new Date().toISOString()
      };

      const invalidStateData = {
        sessionId: 'session-123',
        // Missing codeVerifier
        createdAt: new Date().toISOString()
      };

      mockRedisClient.get.mockImplementation((key: string) => {
        if (key.includes('valid')) {
          return Promise.resolve(JSON.stringify(validStateData));
        } else {
          return Promise.resolve(JSON.stringify(invalidStateData));
        }
      });

      mockRedisClient.del.mockResolvedValue(1);

      // Valid state should work
      const validResult = await stateManager.validateAndConsumeState('valid-state');
      expect(validResult).toEqual({
        sessionId: 'session-123',
        codeVerifier: 'code-verifier-123'
      });

      // Invalid state should return null
      const invalidResult = await stateManager.validateAndConsumeState('invalid-state');
      expect(invalidResult).toBeNull();
    });
  });
});