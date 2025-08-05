import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { RedisClient } from '../../src/utils/redis-client.js';

describe('Redis Debug Tests', () => {
  let redisClient: RedisClient;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.REDIS_URL = 'redis://localhost:6379';
    redisClient = RedisClient.getInstance();
  });

  afterAll(async () => {
    try {
      await redisClient.disconnect?.();
    } catch (error) {
      console.log('Cleanup error (ignored):', error);
    }
  });

  it('should connect to Redis and perform basic operations', async () => {
    // Test basic ping
    const pong = await redisClient.ping();
    expect(pong).toBe('PONG');
  });

  it('should set and get a value', async () => {
    const key = 'test:debug:simple';
    const value = 'test-value';
    
    await redisClient.set(key, value);
    const retrieved = await redisClient.get(key);
    
    expect(retrieved).toBe(value);
    
    // Cleanup
    await redisClient.del(key);
  });

  it('should handle keys pattern matching', async () => {
    // Set a few test keys
    await redisClient.set('test:debug:key1', 'value1');
    await redisClient.set('test:debug:key2', 'value2');
    await redisClient.set('other:key', 'other');
    
    // Get keys with pattern
    const keys = await redisClient.keys('test:debug:*');
    expect(keys.length).toBeGreaterThanOrEqual(2);
    expect(keys).toContain('test:debug:key1');
    expect(keys).toContain('test:debug:key2');
    expect(keys).not.toContain('other:key');
    
    // Cleanup
    await redisClient.del('test:debug:key1');
    await redisClient.del('test:debug:key2');
    await redisClient.del('other:key');
  });

  it('should handle Redis sets (srem operations)', async () => {
    const setKey = 'test:debug:set';
    const member1 = 'member1';
    const member2 = 'member2';
    
    // Add members to set
    await redisClient.getClient().sadd(setKey, member1, member2);
    
    // Check members exist
    const isMember = await redisClient.getClient().sismember(setKey, member1);
    expect(isMember).toBe(true);
    
    // Remove member
    const removed = await redisClient.getClient().srem(setKey, member1);
    expect(removed).toBe(1);
    
    // Check member removed
    const isMemberAfter = await redisClient.getClient().sismember(setKey, member1);
    expect(isMemberAfter).toBe(false);
    
    // Cleanup
    await redisClient.del(setKey);
  });

  it('should handle multiple Redis operations without hanging', async () => {
    const testKeys = ['test:debug:multi1', 'test:debug:multi2', 'test:debug:multi3'];
    
    // Set multiple keys
    for (const key of testKeys) {
      await redisClient.set(key, `value-${key}`);
    }
    
    // Get all keys
    const keys = await redisClient.keys('test:debug:multi*');
    expect(keys.length).toBe(3);
    
    // Delete all keys
    for (const key of testKeys) {
      await redisClient.del(key);
    }
    
    // Verify cleanup
    const keysAfter = await redisClient.keys('test:debug:multi*');
    expect(keysAfter.length).toBe(0);
  });
});