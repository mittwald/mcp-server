/**
 * Registration Access Token Store
 *
 * Manages secure storage and validation of OAuth 2.0 Dynamic Client Registration
 * access tokens per RFC 7592. Tokens are stored as SHA-256 hashes to prevent
 * exposure of plaintext credentials.
 *
 * Key features:
 * - 256-bit entropy token generation (crypto.randomBytes)
 * - SHA-256 hashing before storage (plaintext never persisted)
 * - Timing-safe comparison to prevent timing attacks
 * - Configurable TTL (default: 30 days)
 * - Token revocation support
 */

import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import type Redis from 'ioredis';

/**
 * Stored token record in Redis.
 * Note: The actual token is never stored - only its hash.
 */
export interface RegistrationTokenRecord {
  tokenHash: string;
  clientId: string;
  issuedAt: number;
  expiresAt: number;
  revoked: boolean;
}

/**
 * Result of token validation with specific error reason.
 */
export type TokenValidationResult =
  | { valid: true; record: RegistrationTokenRecord }
  | { valid: false; reason: 'not_found' | 'invalid' | 'expired' | 'revoked' };

/**
 * Options for token creation.
 */
export interface CreateTokenOptions {
  ttlDays?: number;
}

const DEFAULT_TTL_DAYS = 30;
const KEY_PREFIX = 'reg_token:';

/**
 * Generates a SHA-256 hash of the provided token.
 */
function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/**
 * Performs timing-safe comparison of two hex-encoded hashes.
 */
function compareHashesSafely(providedHash: string, storedHash: string): boolean {
  // Both hashes should be 64 characters (256 bits / 4 bits per hex char)
  if (providedHash.length !== storedHash.length) {
    return false;
  }

  const providedBuffer = Buffer.from(providedHash, 'hex');
  const storedBuffer = Buffer.from(storedHash, 'hex');

  // Double-check lengths after conversion
  if (providedBuffer.length !== storedBuffer.length) {
    return false;
  }

  return timingSafeEqual(providedBuffer, storedBuffer);
}

/**
 * Registration Token Store for OAuth 2.0 DCR access tokens.
 *
 * This store manages the lifecycle of registration access tokens:
 * - Creation: Generates secure tokens with configurable TTL
 * - Validation: Verifies tokens with timing-safe comparison
 * - Revocation: Marks tokens as revoked
 *
 * Security properties:
 * - Tokens are generated with 256-bit entropy
 * - Only SHA-256 hashes are stored in Redis
 * - Hash comparison uses crypto.timingSafeEqual
 * - TTL enforced both in Redis and application logic
 */
export class RegistrationTokenStore {
  private redis: Redis;
  private defaultTtlDays: number;

  constructor(redis: Redis, options: { defaultTtlDays?: number } = {}) {
    this.redis = redis;
    this.defaultTtlDays = options.defaultTtlDays ?? DEFAULT_TTL_DAYS;
  }

  /**
   * Generates the Redis key for a client's registration token.
   */
  private getKey(clientId: string): string {
    return `${KEY_PREFIX}${clientId}`;
  }

  /**
   * Creates a new registration access token for a client.
   *
   * Generates a cryptographically secure token with 256-bit entropy,
   * stores only the SHA-256 hash, and returns the plaintext token
   * (which is shown only once to the client).
   *
   * @param clientId - The OAuth client ID this token authorizes
   * @param options - Token creation options (e.g., TTL)
   * @returns The plaintext token and expiration timestamp
   */
  async createToken(
    clientId: string,
    options: CreateTokenOptions = {}
  ): Promise<{ token: string; expiresAt: number }> {
    // Generate 256-bit (32 bytes) of cryptographic entropy
    const tokenBytes = randomBytes(32);
    const token = tokenBytes.toString('base64url');

    // Hash the token - plaintext is never stored
    const tokenHash = hashToken(token);

    const now = Date.now();
    const ttlDays = options.ttlDays ?? this.defaultTtlDays;
    const ttlMs = ttlDays * 24 * 60 * 60 * 1000;
    const expiresAt = now + ttlMs;

    const record: RegistrationTokenRecord = {
      tokenHash,
      clientId,
      issuedAt: now,
      expiresAt,
      revoked: false,
    };

    const key = this.getKey(clientId);
    const ttlSeconds = Math.ceil(ttlMs / 1000);

    await this.redis.setex(key, ttlSeconds, JSON.stringify(record));

    // Return plaintext token (shown once) and expiration
    return { token, expiresAt };
  }

  /**
   * Validates a registration access token for a specific client.
   *
   * Performs the following checks:
   * 1. Token record exists for the client
   * 2. Token hash matches (timing-safe comparison)
   * 3. Token has not expired
   * 4. Token has not been revoked
   *
   * @param clientId - The OAuth client ID to validate against
   * @param providedToken - The plaintext token to validate
   * @returns Validation result with specific error reason if invalid
   */
  async validateToken(
    clientId: string,
    providedToken: string
  ): Promise<TokenValidationResult> {
    const key = this.getKey(clientId);
    const data = await this.redis.get(key);

    if (!data) {
      return { valid: false, reason: 'not_found' };
    }

    let record: RegistrationTokenRecord;
    try {
      record = JSON.parse(data) as RegistrationTokenRecord;
    } catch {
      // Corrupted data - treat as not found
      return { valid: false, reason: 'not_found' };
    }

    // Hash the provided token for comparison
    const providedHash = hashToken(providedToken);

    // Timing-safe comparison to prevent timing attacks
    if (!compareHashesSafely(providedHash, record.tokenHash)) {
      return { valid: false, reason: 'invalid' };
    }

    // Check expiration
    if (Date.now() >= record.expiresAt) {
      return { valid: false, reason: 'expired' };
    }

    // Check revocation
    if (record.revoked) {
      return { valid: false, reason: 'revoked' };
    }

    return { valid: true, record };
  }

  /**
   * Revokes a registration access token.
   *
   * The token record is updated to mark it as revoked rather than
   * deleted, allowing for audit trails. The Redis TTL is maintained.
   *
   * @param clientId - The OAuth client ID whose token should be revoked
   * @returns true if token was revoked, false if not found
   */
  async revokeToken(clientId: string): Promise<boolean> {
    const key = this.getKey(clientId);
    const data = await this.redis.get(key);

    if (!data) {
      return false;
    }

    let record: RegistrationTokenRecord;
    try {
      record = JSON.parse(data) as RegistrationTokenRecord;
    } catch {
      return false;
    }

    if (record.revoked) {
      return true; // Already revoked
    }

    record.revoked = true;

    // Preserve remaining TTL
    const ttl = await this.redis.ttl(key);
    if (ttl > 0) {
      await this.redis.setex(key, ttl, JSON.stringify(record));
    } else {
      await this.redis.set(key, JSON.stringify(record));
    }

    return true;
  }

  /**
   * Retrieves the token record for a client (without validating).
   *
   * This is useful for administrative purposes such as checking
   * token expiration or revocation status.
   *
   * @param clientId - The OAuth client ID
   * @returns The token record if found, null otherwise
   */
  async getTokenForClient(clientId: string): Promise<RegistrationTokenRecord | null> {
    const key = this.getKey(clientId);
    const data = await this.redis.get(key);

    if (!data) {
      return null;
    }

    try {
      return JSON.parse(data) as RegistrationTokenRecord;
    } catch {
      return null;
    }
  }

  /**
   * Deletes the token record for a client.
   *
   * This permanently removes the token record. Use revokeToken()
   * if you want to maintain an audit trail.
   *
   * @param clientId - The OAuth client ID
   * @returns true if token was deleted, false if not found
   */
  async deleteToken(clientId: string): Promise<boolean> {
    const key = this.getKey(clientId);
    const result = await this.redis.del(key);
    return result > 0;
  }
}
