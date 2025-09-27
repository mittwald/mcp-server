import type { AuthorizationRequestRecord, StateStore } from './state-store.js';

interface MemoryStateStoreOptions {
  ttlMs: number;
}

type StoredRecord = AuthorizationRequestRecord;

export class MemoryStateStore implements StateStore {
  private readonly ttlMs: number;
  private readonly authorizationRequests = new Map<string, StoredRecord>();

  constructor(options: MemoryStateStoreOptions) {
    this.ttlMs = options.ttlMs;
    setInterval(() => this.reapExpired(), Math.max(1000, this.ttlMs / 2)).unref();
  }

  async storeAuthorizationRequest(record: AuthorizationRequestRecord): Promise<void> {
    const now = Date.now();
    this.authorizationRequests.set(record.state, {
      ...record,
      createdAt: now,
      expiresAt: now + this.ttlMs
    });
  }

  async getAuthorizationRequest(state: string): Promise<AuthorizationRequestRecord | null> {
    this.reapExpired();
    const record = this.authorizationRequests.get(state);
    if (!record) {
      return null;
    }
    return { ...record };
  }

  async deleteAuthorizationRequest(state: string): Promise<void> {
    this.authorizationRequests.delete(state);
  }

  private reapExpired() {
    const now = Date.now();
    for (const [key, record] of this.authorizationRequests.entries()) {
      if (record.expiresAt <= now) {
        this.authorizationRequests.delete(key);
      }
    }
  }
}
