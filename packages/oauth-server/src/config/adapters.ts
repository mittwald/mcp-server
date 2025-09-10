import * as Redis from 'redis';
import type { Adapter, AdapterPayload } from 'oidc-provider';
import { logger } from '../services/logger.js';

let redisClient: any = null;

export async function createRedisClient(url: string): Promise<any> {
  if (redisClient) {
    return redisClient;
  }

  const client = Redis.createClient({ url });
  
  client.on('error', (err) => {
    logger.error('Redis client error', { error: err.message });
  });

  client.on('connect', () => {
    logger.info('Redis client connected');
  });

  await client.connect();
  redisClient = client;
  return client;
}

export class RedisAdapter implements Adapter {
  private client: any;
  private name: string;

  constructor(client: any, name: string) {
    this.client = client;
    this.name = name;
  }

  private key(id: string): string {
    return `oidc:${this.name}:${id}`;
  }

  async upsert(id: string, payload: AdapterPayload, expiresIn?: number): Promise<void> {
    const key = this.key(id);
    const value = JSON.stringify(payload);
    
    if (expiresIn) {
      await this.client.setEx(key, expiresIn, value);
    } else {
      await this.client.set(key, value);
    }
  }

  async find(id: string): Promise<AdapterPayload | undefined> {
    const key = this.key(id);
    const value = await this.client.get(key);
    
    if (!value) {
      return undefined;
    }

    try {
      return JSON.parse(value);
    } catch (error) {
      logger.error('Failed to parse adapter payload', { 
        error: error instanceof Error ? error.message : String(error),
        key,
        value 
      });
      return undefined;
    }
  }

  async findByUserCode(userCode: string): Promise<AdapterPayload | undefined> {
    const key = `oidc:${this.name}:userCode:${userCode}`;
    const id = await this.client.get(key);
    
    if (!id) {
      return undefined;
    }

    return this.find(id);
  }

  async findByUid(uid: string): Promise<AdapterPayload | undefined> {
    const key = `oidc:${this.name}:uid:${uid}`;
    const id = await this.client.get(key);
    
    if (!id) {
      return undefined;
    }

    return this.find(id);
  }

  async consume(id: string): Promise<void> {
    const payload = await this.find(id);
    if (!payload) {
      return;
    }

    await this.upsert(id, {
      ...payload,
      consumed: Math.floor(Date.now() / 1000),
    });
  }

  async destroy(id: string): Promise<void> {
    const key = this.key(id);
    await this.client.del(key);
  }

  async revokeByGrantId(grantId: string): Promise<void> {
    // Find all keys with this grant ID and delete them
    const pattern = `oidc:${this.name}:*`;
    let cursor = '0';
    
    do {
      const result = await this.client.scan(parseInt(cursor), {
        MATCH: pattern,
        COUNT: 100
      });
      
      cursor = result.cursor.toString();
      const keys = result.keys;
      
      for (const key of keys) {
        const payload = await this.client.get(key);
        if (payload) {
          try {
            const data = JSON.parse(payload);
            if (data.grantId === grantId) {
              await this.client.del(key);
            }
          } catch (error) {
            // Skip malformed entries
          }
        }
      }
    } while (cursor !== '0');
  }
}

export class MemoryAdapter implements Adapter {
  private storage: Map<string, { payload: AdapterPayload; expiresAt?: number }> = new Map();
  private name: string;

  constructor(name: string) {
    this.name = name;
  }

  private key(id: string): string {
    return `${this.name}:${id}`;
  }

  private isExpired(item: { payload: AdapterPayload; expiresAt?: number }): boolean {
    return item.expiresAt ? item.expiresAt < Date.now() : false;
  }

  async upsert(id: string, payload: AdapterPayload, expiresIn?: number): Promise<void> {
    const key = this.key(id);
    const expiresAt = expiresIn ? Date.now() + (expiresIn * 1000) : undefined;
    
    this.storage.set(key, { payload, expiresAt });
  }

  async find(id: string): Promise<AdapterPayload | undefined> {
    const key = this.key(id);
    const item = this.storage.get(key);
    
    if (!item) {
      return undefined;
    }

    if (this.isExpired(item)) {
      this.storage.delete(key);
      return undefined;
    }

    return item.payload;
  }

  async findByUserCode(userCode: string): Promise<AdapterPayload | undefined> {
    // In memory implementation - scan all items
    for (const [key, item] of this.storage.entries()) {
      if (this.isExpired(item)) {
        this.storage.delete(key);
        continue;
      }
      
      if (item.payload.userCode === userCode) {
        return item.payload;
      }
    }
    
    return undefined;
  }

  async findByUid(uid: string): Promise<AdapterPayload | undefined> {
    // In memory implementation - scan all items
    for (const [key, item] of this.storage.entries()) {
      if (this.isExpired(item)) {
        this.storage.delete(key);
        continue;
      }
      
      if (item.payload.uid === uid) {
        return item.payload;
      }
    }
    
    return undefined;
  }

  async consume(id: string): Promise<void> {
    const payload = await this.find(id);
    if (!payload) {
      return;
    }

    await this.upsert(id, {
      ...payload,
      consumed: Math.floor(Date.now() / 1000),
    });
  }

  async destroy(id: string): Promise<void> {
    const key = this.key(id);
    this.storage.delete(key);
  }

  async revokeByGrantId(grantId: string): Promise<void> {
    const keysToDelete: string[] = [];
    
    for (const [key, item] of this.storage.entries()) {
      if (item.payload.grantId === grantId) {
        keysToDelete.push(key);
      }
    }
    
    for (const key of keysToDelete) {
      this.storage.delete(key);
    }
  }
}

export function createAdapter(storageType: 'redis' | 'memory', redisClient?: any) {
  return (name: string): Adapter => {
    if (storageType === 'redis' && redisClient) {
      return new RedisAdapter(redisClient, name);
    }
    return new MemoryAdapter(name);
  };
}