/**
 * Mock RegistrationTokenStore for testing
 *
 * Provides an in-memory implementation that mimics the real store's
 * behavior for unit and integration tests.
 */

import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import type {
  RegistrationTokenStore,
  RegistrationTokenRecord,
  TokenValidationResult,
  CreateTokenOptions,
} from '../../src/registration-token-store.js';

interface StoredToken {
  record: RegistrationTokenRecord;
  ttl?: number;
}

export class MockRegistrationTokenStore implements RegistrationTokenStore {
  private store = new Map<string, StoredToken>();
  private defaultTtlDays: number;

  constructor(options: { defaultTtlDays?: number } = {}) {
    this.defaultTtlDays = options.defaultTtlDays ?? 30;
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private compareHashesSafely(providedHash: string, storedHash: string): boolean {
    if (providedHash.length !== storedHash.length) {
      return false;
    }

    const providedBuffer = Buffer.from(providedHash, 'hex');
    const storedBuffer = Buffer.from(storedHash, 'hex');

    if (providedBuffer.length !== storedBuffer.length) {
      return false;
    }

    return timingSafeEqual(providedBuffer, storedBuffer);
  }

  async createToken(
    clientId: string,
    options: CreateTokenOptions = {}
  ): Promise<{ token: string; expiresAt: number }> {
    const tokenBytes = randomBytes(32);
    const token = tokenBytes.toString('base64url');
    const tokenHash = this.hashToken(token);

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

    this.store.set(clientId, { record, ttl: ttlMs / 1000 });

    return { token, expiresAt };
  }

  async validateToken(
    clientId: string,
    providedToken: string
  ): Promise<TokenValidationResult> {
    const stored = this.store.get(clientId);

    if (!stored) {
      return { valid: false, reason: 'not_found' };
    }

    const providedHash = this.hashToken(providedToken);

    if (!this.compareHashesSafely(providedHash, stored.record.tokenHash)) {
      return { valid: false, reason: 'invalid' };
    }

    if (Date.now() >= stored.record.expiresAt) {
      return { valid: false, reason: 'expired' };
    }

    if (stored.record.revoked) {
      return { valid: false, reason: 'revoked' };
    }

    return { valid: true, record: stored.record };
  }

  async revokeToken(clientId: string): Promise<boolean> {
    const stored = this.store.get(clientId);
    if (!stored) {
      return false;
    }

    stored.record.revoked = true;
    return true;
  }

  async getTokenForClient(clientId: string): Promise<RegistrationTokenRecord | null> {
    const stored = this.store.get(clientId);
    return stored?.record ?? null;
  }

  async deleteToken(clientId: string): Promise<boolean> {
    return this.store.delete(clientId);
  }

  // Test helper to clear all stored tokens
  clear(): void {
    this.store.clear();
  }
}

/**
 * Creates a mock RegistrationTokenStore for testing.
 */
export function createMockTokenStore(
  options: { defaultTtlDays?: number } = {}
): MockRegistrationTokenStore {
  return new MockRegistrationTokenStore(options);
}
