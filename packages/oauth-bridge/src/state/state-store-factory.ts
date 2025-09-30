import { MemoryStateStore } from './memory-state-store.js';
import { RedisStateStore } from './redis-state-store.js';
import type { StateStore } from './state-store.js';

interface CreateStateStoreOptions {
  ttlSeconds: number;
}

export function createStateStore(options: CreateStateStoreOptions): StateStore {
  const storeType = (process.env.BRIDGE_STATE_STORE ?? '').toLowerCase();

  if (storeType === 'redis') {
    return new RedisStateStore({
      redisUrl: process.env.BRIDGE_REDIS_URL || process.env.REDIS_URL,
      ttlSeconds: options.ttlSeconds,
      prefix: process.env.BRIDGE_STATE_PREFIX
    });
  }

  return new MemoryStateStore({ ttlMs: options.ttlSeconds * 1000 });
}
