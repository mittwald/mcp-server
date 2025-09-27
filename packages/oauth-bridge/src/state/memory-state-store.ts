import type { AuthorizationGrantRecord, AuthorizationRequestRecord, StateStore } from './state-store.js';

interface MemoryStateStoreOptions {
  ttlMs: number;
}

type StoredRequest = AuthorizationRequestRecord;
type StoredGrant = AuthorizationGrantRecord;

export class MemoryStateStore implements StateStore {
  private readonly ttlMs: number;
  private readonly requestsByInternalState = new Map<string, StoredRequest>();
  private readonly grantsByCode = new Map<string, StoredGrant>();

  constructor(options: MemoryStateStoreOptions) {
    this.ttlMs = options.ttlMs;
    setInterval(() => this.reapExpired(), Math.max(1000, this.ttlMs / 2)).unref();
  }

  async storeAuthorizationRequest(record: AuthorizationRequestRecord): Promise<void> {
    const now = Date.now();
    this.requestsByInternalState.set(record.internalState, {
      ...record,
      createdAt: now,
      expiresAt: now + this.ttlMs
    });
  }

  async getAuthorizationRequestByInternalState(internalState: string): Promise<AuthorizationRequestRecord | null> {
    this.reapExpired();
    const record = this.requestsByInternalState.get(internalState);
    if (!record) {
      return null;
    }
    return { ...record };
  }

  async deleteAuthorizationRequestByInternalState(internalState: string): Promise<void> {
    this.requestsByInternalState.delete(internalState);
  }

  async storeAuthorizationGrant(record: AuthorizationGrantRecord): Promise<void> {
    const now = Date.now();
    this.grantsByCode.set(record.authorizationCode, {
      ...record,
      createdAt: now,
      expiresAt: now + this.ttlMs
    });
  }

  async getAuthorizationGrant(authorizationCode: string): Promise<AuthorizationGrantRecord | null> {
    this.reapExpired();
    const record = this.grantsByCode.get(authorizationCode);
    if (!record) {
      return null;
    }
    return { ...record };
  }

  async updateAuthorizationGrant(record: AuthorizationGrantRecord): Promise<void> {
    if (!this.grantsByCode.has(record.authorizationCode)) {
      throw new Error('authorization code not found');
    }
    this.grantsByCode.set(record.authorizationCode, { ...record });
  }

  async deleteAuthorizationGrant(authorizationCode: string): Promise<void> {
    this.grantsByCode.delete(authorizationCode);
  }

  private reapExpired() {
    const now = Date.now();

    for (const [key, record] of this.requestsByInternalState.entries()) {
      if (record.expiresAt <= now) {
        this.requestsByInternalState.delete(key);
      }
    }

    for (const [key, record] of this.grantsByCode.entries()) {
      if (record.expiresAt <= now) {
        this.grantsByCode.delete(key);
      }
    }
  }
}
