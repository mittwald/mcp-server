import { MemoryStateStore } from './memory-state-store.js';
import { RedisStateStore } from './redis-state-store.js';
import type { StateStore } from './state-store.js';

interface CreateStateStoreOptions {
  /**
   * Legacy TTL value (applies to both state and grants if specific values are omitted).
   */
  ttlSeconds?: number;
  /**
   * TTL for authorization request state entries.
   */
  authRequestTtlSeconds?: number;
  /**
   * TTL for authorization grants / refresh token lookup state.
   */
  grantTtlSeconds?: number;
}

export function createStateStore(options: CreateStateStoreOptions): StateStore {
  const storeType = (process.env.BRIDGE_STATE_STORE ?? '').toLowerCase();
  const legacyTtlSeconds = Math.max(1, options.ttlSeconds ?? 300);
  const authRequestTtlSeconds = Math.max(
    1,
    options.authRequestTtlSeconds ?? legacyTtlSeconds
  );
  const grantTtlSeconds = Math.max(
    1,
    options.grantTtlSeconds ?? legacyTtlSeconds
  );

  if (storeType === 'redis') {
    return new RedisStateStore({
      redisUrl: process.env.BRIDGE_REDIS_URL || process.env.REDIS_URL,
      authRequestTtlSeconds,
      grantTtlSeconds,
      prefix: process.env.BRIDGE_STATE_PREFIX
    });
  }

  return new MemoryStateStore({
    authRequestTtlMs: authRequestTtlSeconds * 1000,
    grantTtlMs: grantTtlSeconds * 1000
  });
}
