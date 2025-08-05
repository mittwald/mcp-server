import Redis from 'ioredis';
import { logger } from './logger.js';

export interface RedisConfig {
  url?: string;
  host?: string;
  port?: number;
  password?: string;
  db?: number;
  maxRetriesPerRequest?: number;
  retryDelayOnFailover?: number;
  lazyConnect?: boolean;
}

export class RedisClient {
  private client: Redis;
  private static instance: RedisClient | null = null;

  constructor(config: RedisConfig = {}) {
    const redisUrl = config.url || process.env.REDIS_URL || 'redis://localhost:6379';
    
    this.client = new Redis(redisUrl, {
      maxRetriesPerRequest: config.maxRetriesPerRequest || 3,
      retryDelayOnFailover: config.retryDelayOnFailover || 100,
      lazyConnect: config.lazyConnect || true,
      ...config,
    });

    this.client.on('connect', () => {
      logger.info('Redis client connected');
    });

    this.client.on('error', (error) => {
      logger.error('Redis client error:', error);
    });

    this.client.on('close', () => {
      logger.warn('Redis client connection closed');
    });
  }

  static getInstance(config?: RedisConfig): RedisClient {
    if (!RedisClient.instance) {
      RedisClient.instance = new RedisClient(config);
    }
    return RedisClient.instance;
  }

  async connect(): Promise<void> {
    try {
      await this.client.connect();
      logger.info('Redis client successfully connected');
    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.client.disconnect();
      logger.info('Redis client disconnected');
    } catch (error) {
      logger.error('Error disconnecting from Redis:', error);
      throw error;
    }
  }

  async ping(): Promise<string> {
    return await this.client.ping();
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<'OK'> {
    if (ttlSeconds) {
      return await this.client.setex(key, ttlSeconds, value);
    }
    return await this.client.set(key, value);
  }

  async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  async del(key: string): Promise<number> {
    return await this.client.del(key);
  }

  async exists(key: string): Promise<number> {
    return await this.client.exists(key);
  }

  async expire(key: string, seconds: number): Promise<number> {
    return await this.client.expire(key, seconds);
  }

  async ttl(key: string): Promise<number> {
    return await this.client.ttl(key);
  }

  async hset(key: string, field: string, value: string): Promise<number> {
    return await this.client.hset(key, field, value);
  }

  async hget(key: string, field: string): Promise<string | null> {
    return await this.client.hget(key, field);
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    return await this.client.hgetall(key);
  }

  async hdel(key: string, field: string): Promise<number> {
    return await this.client.hdel(key, field);
  }

  async keys(pattern: string): Promise<string[]> {
    return await this.client.keys(pattern);
  }

  getClient(): Redis {
    return this.client;
  }
}

export const redisClient = RedisClient.getInstance();