import { logger } from './logger.js';

export interface InteractionRecord {
  uid: string;
  oidcInteractionUid: string;
  state: string;
  nonce: string;
  codeVerifier: string;
  clientRedirectUri: string;
  clientId: string;
  createdAt: number;
}

export interface InteractionStore {
  save(record: InteractionRecord, ttlSeconds: number): Promise<void>;
  getByState(state: string): Promise<InteractionRecord | undefined>;
  consumeByState(state: string): Promise<InteractionRecord | undefined>;
  getConsumedByState?(state: string): Promise<InteractionRecord | undefined>;
}

class MemoryInteractionStore implements InteractionStore {
  private map = new Map<string, { rec: InteractionRecord; exp?: number; consumed?: boolean; consumedAt?: number }>();

  async save(record: InteractionRecord, ttlSeconds: number): Promise<void> {
    const exp = Date.now() + ttlSeconds * 1000;
    this.map.set(`state:${record.state}`, { rec: record, exp });
  }
  async getByState(state: string): Promise<InteractionRecord | undefined> {
    const item = this.map.get(`state:${state}`);
    if (!item) return undefined;
    if (item.exp && item.exp < Date.now()) {
      this.map.delete(`state:${state}`);
      return undefined;
    }
    return item.rec;
  }
  async consumeByState(state: string): Promise<InteractionRecord | undefined> {
    const rec = await this.getByState(state);
    if (rec) {
      // Mark as consumed but keep for 30 seconds to handle duplicate callbacks
      const item = this.map.get(`state:${state}`);
      if (item && !item.consumed) {
        item.consumed = true;
        item.consumedAt = Date.now();
        // Delete after 30 seconds
        setTimeout(() => this.map.delete(`state:${state}`), 30000);
        return rec; // Return record on first consumption
      }
      // Already consumed - return undefined for subsequent calls
      return undefined;
    }
    return rec;
  }

  async getConsumedByState(state: string): Promise<InteractionRecord | undefined> {
    const item = this.map.get(`state:${state}`);
    if (!item) return undefined;
    if (item.exp && item.exp < Date.now()) {
      this.map.delete(`state:${state}`);
      return undefined;
    }
    // Return record even if consumed (for duplicate callback handling)
    return item.rec;
  }

  size(): number {
    return this.map.size;
  }
}

class RedisInteractionStore implements InteractionStore {
  private client: any;
  private prefix = 'mcp:interaction';
  constructor(client: any) {
    this.client = client;
  }
  private key(state: string) {
    return `${this.prefix}:state:${state}`;
  }
  async save(record: InteractionRecord, ttlSeconds: number): Promise<void> {
    const key = this.key(record.state);
    await this.client.setEx(key, ttlSeconds, JSON.stringify(record));
  }
  async getByState(state: string): Promise<InteractionRecord | undefined> {
    const val = await this.client.get(this.key(state));
    if (!val) return undefined;
    try {
      return JSON.parse(val) as InteractionRecord;
    } catch (e) {
      logger.error('Failed parsing interaction record', { error: (e as Error).message });
      return undefined;
    }
  }
  async consumeByState(state: string): Promise<InteractionRecord | undefined> {
    const key = this.key(state);
    const val = await this.client.getDel ? await this.client.getDel(key) : await this.client.get(key);
    if (!val) return undefined;
    if (!this.client.getDel) {
      await this.client.del(key);
    }
    try {
      return JSON.parse(val) as InteractionRecord;
    } catch {
      return undefined;
    }
  }
}

// Singleton store instance to prevent multiple stores
let globalStore: InteractionStore | null = null;

export function createInteractionStore(): InteractionStore {
  if (!globalStore) {
    // For now, use memory store for interaction data (it's short-lived anyway)
    // Could be migrated to SQLite later if needed for better persistence
    logger.info('Creating singleton in-memory interaction store (sufficient for short-lived OAuth interactions)');
    globalStore = new MemoryInteractionStore();
  } else {
    logger.info('Reusing existing interaction store instance');
  }
  return globalStore;
}
