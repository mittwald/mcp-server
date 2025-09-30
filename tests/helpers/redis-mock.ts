import { vi } from 'vitest';

type StoredValue = {
  value: string;
  expireAt?: number;
};

type RedisSet = Set<string> & { expireAt?: number };

const store = new Map<string, StoredValue>();
const sets = new Map<string, RedisSet>();

const ensureSet = (key: string): RedisSet => {
  let set = sets.get(key);
  if (!set) {
    set = new Set<string>() as RedisSet;
    sets.set(key, set);
  }
  return set;
};

const isExpired = (entry?: { expireAt?: number }) =>
  entry?.expireAt !== undefined && entry.expireAt <= Date.now();

const redisClient = {
  async set(key: string, value: string, ttlSeconds?: number) {
    store.set(key, {
      value,
      expireAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined,
    });
    return 'OK';
  },
  async setex(key: string, ttlSeconds: number, value: string) {
    return this.set(key, value, ttlSeconds);
  },
  async get(key: string) {
    const entry = store.get(key);
    if (!entry) return null;
    if (isExpired(entry)) {
      store.delete(key);
      sets.delete(key);
      return null;
    }
    return entry.value;
  },
  async del(key: string) {
    const deleted = store.delete(key) || sets.delete(key);
    return deleted ? 1 : 0;
  },
  async keys(pattern: string) {
    const prefix = pattern.endsWith('*') ? pattern.slice(0, -1) : pattern;
    return Array.from(store.keys()).filter((key) => key.startsWith(prefix));
  },
  async exists(key: string) {
    const entry = store.get(key);
    if (!entry) return 0;
    if (isExpired(entry)) {
      store.delete(key);
      return 0;
    }
    return 1;
  },
  async expire(key: string, ttlSeconds: number) {
    const entry = store.get(key);
    if (!entry) return 0;
    entry.expireAt = Date.now() + ttlSeconds * 1000;
    return 1;
  },
  async ttl(key: string) {
    const entry = store.get(key);
    if (!entry || entry.expireAt === undefined) return -1;
    const remaining = entry.expireAt - Date.now();
    return remaining > 0 ? Math.ceil(remaining / 1000) : -2;
  },
  async getDel(key: string) {
    const value = await this.get(key);
    await this.del(key);
    return value;
  },
  getClient() {
    return {
      sadd: async (key: string, member: string) => {
        const set = ensureSet(key);
        const before = set.size;
        set.add(member);
        return set.size === before ? 0 : 1;
      },
      srem: async (key: string, member: string) => {
        const set = sets.get(key);
        if (!set) return 0;
        return set.delete(member) ? 1 : 0;
      },
      smembers: async (key: string) => {
        const set = sets.get(key);
        if (!set) return [];
        return Array.from(set.values());
      },
    };
  },
  async quit() {
    store.clear();
    sets.clear();
  },
} as any;

redisClient.__reset = () => {
  store.clear();
  sets.clear();
};

vi.mock('../../src/utils/redis-client.js', () => ({
  redisClient,
}));

export const redisClientMock = redisClient;
export const resetRedisMock = () => redisClient.__reset();
