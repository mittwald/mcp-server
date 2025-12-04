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
  private readonly refreshTokenToCode = new Map<string, string>();
  private readonly clientsById = new Map<string, ClientRegistrationRecord>();

  constructor(options: MemoryStateStoreOptions) {
    this.ttlMs = options.ttlMs;
    setInterval(() => this.reapExpired(), Math.max(1000, this.ttlMs / 2)).unref();
  }

  /**
   * Validates PKCE parameters per RFC 7636 and FR-005 requirements.
   *
   * For S256 method:
   * - code_challenge = BASE64URL(SHA256(code_verifier))
   * - SHA-256 produces 32 bytes, which base64url encodes to 43 characters
   * - code_verifier must be 43-128 characters
   *
   * Per FR-005: System MUST store non-empty PKCE code_verifier and code_challenge with state
   *
   * @throws Error if codeChallenge or mittwaldCodeVerifier is invalid
   */
  private validatePkceParameters(record: AuthorizationRequestRecord): void {
    // codeChallenge must not be empty
    if (!record.codeChallenge || record.codeChallenge === '') {
      throw new Error('codeChallenge is required and cannot be empty');
    }

    // mittwaldCodeVerifier must be present and RFC 7636 compliant
    if (!record.mittwaldCodeVerifier || record.mittwaldCodeVerifier.trim() === '') {
      throw new Error('mittwaldCodeVerifier is required and cannot be empty (FR-005)');
    }
    if (record.mittwaldCodeVerifier.length < 43 || record.mittwaldCodeVerifier.length > 128) {
      throw new Error('mittwaldCodeVerifier must be 43-128 characters');
    }
    if (!/^[A-Za-z0-9._~-]+$/.test(record.mittwaldCodeVerifier)) {
      throw new Error('mittwaldCodeVerifier must be base64url encoded');
    }

    // For S256, code_challenge must be exactly 43 characters (base64url of 32-byte SHA-256)
    if (record.codeChallengeMethod === 'S256') {
      if (record.codeChallenge.length !== 43) {
        throw new Error('code_challenge for S256 must be 43 characters');
      }

      // Validate base64url characters (A-Z, a-z, 0-9, -, _)
      if (!/^[A-Za-z0-9_-]+$/.test(record.codeChallenge)) {
        throw new Error('code_challenge must be base64url encoded');
      }
    }

    // Per FR-005: mittwaldCodeVerifier must be non-empty and valid per RFC 7636
    if (!record.mittwaldCodeVerifier || record.mittwaldCodeVerifier === '') {
      throw new Error('mittwaldCodeVerifier is required and cannot be empty (FR-005)');
    }

    // RFC 7636 Section 4.1: code_verifier must be 43-128 characters
    if (record.mittwaldCodeVerifier.length < 43 || record.mittwaldCodeVerifier.length > 128) {
      throw new Error(`mittwaldCodeVerifier must be 43-128 characters (got ${record.mittwaldCodeVerifier.length})`);
    }

    // Validate base64url characters for verifier
    if (!/^[A-Za-z0-9_-]+$/.test(record.mittwaldCodeVerifier)) {
      throw new Error('mittwaldCodeVerifier must be base64url encoded');
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

  async getAuthorizationGrantByRefreshToken(refreshToken: string): Promise<AuthorizationGrantRecord | null> {
    this.reapExpired();

    // Look up the authorization code from the refresh token index
    const authorizationCode = this.refreshTokenToCode.get(refreshToken);
    if (!authorizationCode) {
      return null;
    }

    // Retrieve the grant using the authorization code
    const record = this.grantsByCode.get(authorizationCode);
    if (!record) {
      // Index is stale, clean it up
      this.refreshTokenToCode.delete(refreshToken);
      return null;
    }

    // Verify refresh token matches and hasn't expired
    if (record.refreshToken !== refreshToken) {
      return null;
    }

    if (record.refreshTokenExpiresAt && record.refreshTokenExpiresAt <= Math.floor(Date.now() / 1000)) {
      return null;
    }

    return { ...record };
  }

  async updateAuthorizationGrant(record: AuthorizationGrantRecord): Promise<void> {
    if (!this.grantsByCode.has(record.authorizationCode)) {
      throw new Error('authorization code not found');
    }
    this.grantsByCode.set(record.authorizationCode, { ...record });

    // If the grant has a refresh token, create/update the refresh token index
    if (record.refreshToken) {
      this.refreshTokenToCode.set(record.refreshToken, record.authorizationCode);
    }
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
