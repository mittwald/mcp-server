import type {
  AuthorizationGrantRecord,
  AuthorizationRequestRecord,
  ClientRegistrationRecord,
  StateStore,
  StateStoreHealth,
  StateStoreMetrics
} from './state-store.js';

interface MemoryStateStoreOptions {
  ttlMs: number;
}

type StoredRequest = AuthorizationRequestRecord;
type StoredGrant = AuthorizationGrantRecord;

export class MemoryStateStore implements StateStore {
  private readonly ttlMs: number;
  private readonly requestsByInternalState = new Map<string, StoredRequest>();
  private readonly grantsByCode = new Map<string, StoredGrant>();
  private readonly clientsById = new Map<string, ClientRegistrationRecord>();

  constructor(options: MemoryStateStoreOptions) {
    this.ttlMs = options.ttlMs;
    setInterval(() => this.reapExpired(), Math.max(1000, this.ttlMs / 2)).unref();
  }

  /**
   * Validates PKCE parameters per RFC 7636 requirements.
   * @throws Error if codeChallenge is empty
   */
  private validatePkceParameters(record: AuthorizationRequestRecord): void {
    if (!record.codeChallenge || record.codeChallenge === '') {
      throw new Error('codeChallenge is required and cannot be empty');
    }
  }

  async storeAuthorizationRequest(record: AuthorizationRequestRecord): Promise<void> {
    // Validate PKCE parameters before storing
    this.validatePkceParameters(record);

    const now = Date.now();
    this.requestsByInternalState.set(record.internalState, {
      ...record,
      createdAt: now,
      expiresAt: now + this.ttlMs,
      consumed: false
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

  /**
   * Atomically retrieves and consumes the authorization request (delete-on-read).
   * Implements single-use enforcement per OAuth 2.0 security best practices.
   */
  async getAndConsumeState(internalState: string): Promise<AuthorizationRequestRecord | null> {
    this.reapExpired();
    const record = this.requestsByInternalState.get(internalState);
    if (!record) {
      return null;
    }

    // Delete immediately (single-use enforcement)
    this.requestsByInternalState.delete(internalState);

    // Check if already consumed (belt-and-suspenders)
    if (record.consumed) {
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

  async storeClientRegistration(record: ClientRegistrationRecord): Promise<void> {
    this.clientsById.set(record.clientId, { ...record });
  }

  async getClientRegistration(clientId: string): Promise<ClientRegistrationRecord | null> {
    const record = this.clientsById.get(clientId);
    return record ? { ...record } : null;
  }

  async deleteClientRegistration(clientId: string): Promise<void> {
    this.clientsById.delete(clientId);
  }

  async healthCheck(): Promise<StateStoreHealth> {
    return { status: 'ok' };
  }

  async getMetrics(): Promise<StateStoreMetrics> {
    return {
      implementation: 'memory',
      ttlSeconds: Math.floor(this.ttlMs / 1000),
      pendingAuthorizations: this.requestsByInternalState.size,
      pendingGrants: this.grantsByCode.size,
      registeredClients: this.clientsById.size
    };
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
