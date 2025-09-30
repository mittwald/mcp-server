import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { redisClientMock, resetRedisMock } from '../../helpers/redis-mock.ts';
import { OAuthStateManager } from '../../../src/auth/oauth-state-manager.js';

// Mock logger
vi.mock('../../../src/utils/logger.js', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  }
}));

vi.mock('openid-client', () => ({
  randomState: vi.fn(() => 'mock-random-state'),
}));

describe('OAuthStateManager', () => {
  let stateManager: OAuthStateManager;
  let mockRedisClient: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    resetRedisMock();
    mockRedisClient = redisClientMock;
    mockRedisClient.set = vi.fn(mockRedisClient.set.bind(mockRedisClient));
    mockRedisClient.get = vi.fn(mockRedisClient.get.bind(mockRedisClient));
    mockRedisClient.del = vi.fn(mockRedisClient.del.bind(mockRedisClient));
    mockRedisClient.keys = vi.fn(mockRedisClient.keys.bind(mockRedisClient));

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
        codeVerifier: '',
        codeChallenge: '',
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
        .rejects.toThrow('Failed to create OAuth state');
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
        expiresAt: expiredDate.toISOString(),
        createdAt: expiredDate.toISOString()
      };

      mockRedisClient.get.mockResolvedValue(JSON.stringify(storedData));
      mockRedisClient.del.mockResolvedValue(1);

      const result = await stateManager.getState(state);

      expect(result).toBeNull();
      expect(mockRedisClient.del).toHaveBeenCalledWith(`oauth_state:${state}`);
    });

    it('should handle malformed stored data', async () => {
      const state = 'malformed-state';

      mockRedisClient.get.mockResolvedValue('invalid-json');

      const result = await stateManager.getState(state);

      expect(result).toBeNull();
    });

    it('should handle Redis retrieval errors', async () => {
      const state = 'error-state';
      const error = new Error('Redis connection failed');

      mockRedisClient.get.mockRejectedValue(error);

      await expect(stateManager.getState(state)).resolves.toBeNull();
    });
  });

  describe('updateState', () => {
    it('should merge updates into existing state', async () => {
      const state = 'update-state';
      const existing = {
        state,
        sessionId: 'session-1',
        codeVerifier: '',
        codeChallenge: '',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 600_000).toISOString(),
      };

      mockRedisClient.get.mockResolvedValue(JSON.stringify(existing));
      mockRedisClient.set.mockResolvedValue('OK');

      await stateManager.updateState(state, {
        codeVerifier: 'new-verifier',
      });

      expect(mockRedisClient.set).toHaveBeenCalledWith(
        `oauth_state:${state}`,
        expect.stringContaining('new-verifier'),
        600
      );
    });

    it('should throw when updating missing state', async () => {
      mockRedisClient.get.mockResolvedValue(null);

      await expect(stateManager.updateState('missing', { codeVerifier: 'a' }))
        .rejects.toThrow('OAuth state not found');
    });
  });

  describe('deleteState', () => {
    it('should delete state without throwing', async () => {
      mockRedisClient.del.mockResolvedValue(1);

      await expect(stateManager.deleteState('to-delete')).resolves.toBeUndefined();
      expect(mockRedisClient.del).toHaveBeenCalledWith('oauth_state:to-delete');
    });
  });

  describe('cleanupExpiredStates', () => {
    it('should clean up expired OAuth states', async () => {
      const expiredStates = ['oauth_state:expired1', 'oauth_state:expired2'];
      const validStates = ['oauth_state:valid1'];
      const allStates = [...expiredStates, ...validStates];

      // Mock expired data
      const expiredData = {
        sessionId: 'session-123',
        codeVerifier: 'code-verifier',
        createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        expiresAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      };

      // Mock valid data
      const validData = {
        sessionId: 'session-456',
        codeVerifier: 'code-verifier',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
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
      expect(mockRedisClient.keys).toHaveBeenCalledWith('oauth_state:*');
      expect(mockRedisClient.del).toHaveBeenCalledTimes(2);
      expect(mockRedisClient.del).toHaveBeenCalledWith('oauth_state:expired1');
      expect(mockRedisClient.del).toHaveBeenCalledWith('oauth_state:expired2');
    });

    it('should handle cleanup errors gracefully', async () => {
      const error = new Error('Redis cleanup failed');
      mockRedisClient.keys.mockRejectedValue(error);

      const cleaned = await stateManager.cleanupExpiredStates();
      expect(cleaned).toBe(0);
    });

    it('should return 0 when no states exist', async () => {
      mockRedisClient.keys.mockResolvedValue([]);

      const cleanedCount = await stateManager.cleanupExpiredStates();

      expect(cleanedCount).toBe(0);
    });
  });

});
