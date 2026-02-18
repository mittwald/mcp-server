import Redis from 'ioredis';
import type {
  AuthorizationGrantRecord,
  AuthorizationRequestRecord,
  ClientRegistrationRecord,
  StateStore,
  StateStoreHealth,
  StateStoreMetrics
} from './state-store.js';

interface RedisStateStoreOptions {
  redisUrl?: string;
  /**
   * Legacy TTL value (applies to both state and grants if specific values are omitted).
   */
  ttlSeconds?: number;
  /**
   * TTL for authorization request state entries.
   */
  authRequestTtlSeconds?: number;
  /**
   * TTL for authorization grants / refresh-token lookup records.
   */
  grantTtlSeconds?: number;
  prefix?: string;
}

const DEFAULT_PREFIX = 'bridge';

export class RedisStateStore implements StateStore {
  private readonly redis: Redis;
  private readonly authRequestTtlSeconds: number;
  private readonly grantTtlSeconds: number;
  private readonly prefix: string;

  constructor(options: RedisStateStoreOptions) {
    const legacyTtlSeconds = Math.max(1, options.ttlSeconds ?? 300);
    this.redis = new Redis(options.redisUrl ?? process.env.BRIDGE_REDIS_URL ?? process.env.REDIS_URL ?? 'redis://localhost:6379');
    this.authRequestTtlSeconds = Math.max(
      1,
      options.authRequestTtlSeconds ?? legacyTtlSeconds
    );
    this.grantTtlSeconds = Math.max(
      1,
      options.grantTtlSeconds ?? legacyTtlSeconds
    );
    this.prefix = options.prefix ?? DEFAULT_PREFIX;
  }

  private authRequestKey(internalState: string) {
    return `${this.prefix}:authreq:${internalState}`;
  }

  private grantKey(code: string) {
    return `${this.prefix}:grant:${code}`;
  }

  private clientKey(clientId: string) {
    return `${this.prefix}:client:${clientId}`;
  }

  private refreshTokenKey(refreshToken: string) {
    return `${this.prefix}:refresh:${refreshToken}`;
  }

  private scanCount(pattern: string): Promise<number> {
    const countPerScan = 500;
    const iterate = async (cursor: string, total: number): Promise<number> => {
      const [nextCursor, keys] = await this.redis.scan(cursor, 'MATCH', pattern, 'COUNT', countPerScan);
      const newTotal = total + keys.length;
      if (nextCursor === '0') {
        return newTotal;
      }
      return iterate(nextCursor, newTotal);
    };

    return iterate('0', 0);
  }

  private async setJson(key: string, value: unknown, ttlSeconds?: number) {
    const payload = JSON.stringify(value);
    if (ttlSeconds && ttlSeconds > 0) {
      await this.redis.set(key, payload, 'EX', ttlSeconds);
    } else {
      await this.redis.set(key, payload);
    }
  }

  private async getJson<T>(key: string): Promise<T | null> {
    const payload = await this.redis.get(key);
    if (!payload) {
      return null;
    }
    try {
      return JSON.parse(payload) as T;
    } catch {
      await this.redis.del(key);
      return null;
    }
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

    // mittwaldCodeVerifier must be present and within RFC 7636 length bounds
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
    const withTimestamps = {
      ...record,
      createdAt: now,
      expiresAt: now + this.authRequestTtlSeconds * 1000,
      consumed: false
    } satisfies AuthorizationRequestRecord;

    await this.setJson(
      this.authRequestKey(record.internalState),
      withTimestamps,
      this.authRequestTtlSeconds
    );
  }

  async getAuthorizationRequestByInternalState(internalState: string): Promise<AuthorizationRequestRecord | null> {
    const record = await this.getJson<AuthorizationRequestRecord>(this.authRequestKey(internalState));
    if (!record) {
      return null;
    }
    if (record.expiresAt && record.expiresAt <= Date.now()) {
      await this.deleteAuthorizationRequestByInternalState(internalState);
      return null;
    }
    return record;
  }

  /**
   * Atomically retrieves and consumes the authorization request (delete-on-read).
   * Implements single-use enforcement per OAuth 2.0 security best practices.
   *
   * The record is deleted immediately after successful retrieval, ensuring
   * that the state parameter can only be used once. This prevents replay attacks.
   *
   * @param internalState - The internal state identifier
   * @returns The authorization request record if valid, null if not found/expired/consumed
   */
  async getAndConsumeState(internalState: string): Promise<AuthorizationRequestRecord | null> {
    const key = this.authRequestKey(internalState);

    // Get the record first
    const payload = await this.redis.get(key);
    if (!payload) {
      return null;
    }

    // Delete immediately after read (single-use enforcement)
    // Note: This is not perfectly atomic, but provides strong practical protection.
    // For true atomicity, Redis 6.2+ GETDEL could be used.
    await this.redis.del(key);

    let record: AuthorizationRequestRecord;
    try {
      record = JSON.parse(payload) as AuthorizationRequestRecord;
    } catch {
      // Corrupted data - already deleted, return null
      return null;
    }

    // Check expiration
    if (record.expiresAt && record.expiresAt <= Date.now()) {
      return null;
    }

    // Check if already consumed (belt-and-suspenders with delete-on-read)
    if (record.consumed) {
      return null;
    }

    return record;
  }

  async deleteAuthorizationRequestByInternalState(internalState: string): Promise<void> {
    await this.redis.del(this.authRequestKey(internalState));
  }

  async storeAuthorizationGrant(record: AuthorizationGrantRecord): Promise<void> {
    const now = Date.now();
    const withTimestamps = {
      ...record,
      createdAt: now,
      expiresAt: now + this.grantTtlSeconds * 1000
    } satisfies AuthorizationGrantRecord;

    await this.setJson(
      this.grantKey(record.authorizationCode),
      withTimestamps,
      this.grantTtlSeconds
    );
  }

  async getAuthorizationGrant(authorizationCode: string): Promise<AuthorizationGrantRecord | null> {
    const record = await this.getJson<AuthorizationGrantRecord>(this.grantKey(authorizationCode));
    if (!record) {
      return null;
    }
    if (record.expiresAt && record.expiresAt <= Date.now()) {
      await this.deleteAuthorizationGrant(authorizationCode);
      return null;
    }
    return record;
  }

  async getAuthorizationGrantByRefreshToken(refreshToken: string): Promise<AuthorizationGrantRecord | null> {
    // Look up the authorization code from the refresh token index
    const authorizationCode = await this.redis.get(this.refreshTokenKey(refreshToken));
    if (!authorizationCode) {
      return null;
    }

    // Retrieve the grant using the authorization code
    const record = await this.getJson<AuthorizationGrantRecord>(this.grantKey(authorizationCode));
    if (!record) {
      // Index is stale, clean it up
      await this.redis.del(this.refreshTokenKey(refreshToken));
      return null;
    }

    // Verify refresh token matches and hasn't expired
    if (record.refreshToken !== refreshToken) {
      await this.redis.del(this.refreshTokenKey(refreshToken));
      return null;
    }

    if (record.refreshTokenExpiresAt && record.refreshTokenExpiresAt <= Math.floor(Date.now() / 1000)) {
      await this.redis.del(this.refreshTokenKey(refreshToken));
      return null;
    }

    return record;
  }

  async updateAuthorizationGrant(record: AuthorizationGrantRecord): Promise<void> {
    const existing = await this.getJson<AuthorizationGrantRecord>(
      this.grantKey(record.authorizationCode)
    );
    const nowSeconds = Math.floor(Date.now() / 1000);
    const grantTtlSeconds = record.refreshTokenExpiresAt
      ? Math.max(1, record.refreshTokenExpiresAt - nowSeconds)
      : this.grantTtlSeconds;

    await this.setJson(
      this.grantKey(record.authorizationCode),
      record,
      grantTtlSeconds
    );

    // Remove stale refresh-token index entry after rotation.
    if (
      existing?.refreshToken &&
      record.refreshToken &&
      existing.refreshToken !== record.refreshToken
    ) {
      await this.redis.del(this.refreshTokenKey(existing.refreshToken));
    }

    // If the grant has a refresh token, create/update the refresh token index
    if (record.refreshToken) {
      // Use refresh token TTL if available, otherwise use grant TTL
      const refreshTtl = record.refreshTokenExpiresAt
        ? Math.max(1, record.refreshTokenExpiresAt - nowSeconds)
        : grantTtlSeconds;
      await this.redis.set(this.refreshTokenKey(record.refreshToken), record.authorizationCode, 'EX', refreshTtl);
    }
  }

  async deleteAuthorizationGrant(authorizationCode: string): Promise<void> {
    const existing = await this.getJson<AuthorizationGrantRecord>(
      this.grantKey(authorizationCode)
    );
    if (existing?.refreshToken) {
      await this.redis.del(this.refreshTokenKey(existing.refreshToken));
    }
    await this.redis.del(this.grantKey(authorizationCode));
  }

  async storeClientRegistration(record: ClientRegistrationRecord): Promise<void> {
    await this.setJson(this.clientKey(record.clientId), record);
  }

  async getClientRegistration(clientId: string): Promise<ClientRegistrationRecord | null> {
    return await this.getJson<ClientRegistrationRecord>(this.clientKey(clientId));
  }

  async deleteClientRegistration(clientId: string): Promise<void> {
    await this.redis.del(this.clientKey(clientId));
  }

  async healthCheck(): Promise<StateStoreHealth> {
    try {
      const pingResult = await this.redis.ping();
      return {
        status: pingResult === 'PONG' ? 'ok' : 'error',
        details: { ping: pingResult }
      };
    } catch (error) {
      return {
        status: 'error',
        details: {
          error: error instanceof Error ? error.message : String(error)
        }
      };
    }
  }

  async getMetrics(): Promise<StateStoreMetrics> {
    const [authRequests, grants, clients] = await Promise.all([
      this.scanCount(`${this.prefix}:authreq:*`),
      this.scanCount(`${this.prefix}:grant:*`),
      this.scanCount(`${this.prefix}:client:*`)
    ]);

    return {
      implementation: 'redis',
      ttlSeconds: this.authRequestTtlSeconds,
      authRequestTtlSeconds: this.authRequestTtlSeconds,
      grantTtlSeconds: this.grantTtlSeconds,
      pendingAuthorizations: authRequests,
      pendingGrants: grants,
      registeredClients: clients
    };
  }
}
