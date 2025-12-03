/**
 * Unit tests for RegistrationTokenStore
 *
 * Tests cover:
 * - Token creation with 256-bit entropy
 * - Token validation with timing-safe comparison
 * - Token expiration handling
 * - Token revocation
 * - Error handling
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createHash, randomBytes } from 'node:crypto';
import { RegistrationTokenStore, type RegistrationTokenRecord } from '../../src/registration-token-store.js';

// Mock Redis client for unit tests
function createMockRedis() {
  const store = new Map<string, { value: string; ttl?: number }>();

  return {
    async setex(key: string, ttl: number, value: string) {
      store.set(key, { value, ttl });
      return 'OK';
    },
    async set(key: string, value: string) {
      store.set(key, { value });
      return 'OK';
    },
    async get(key: string) {
      const entry = store.get(key);
      return entry?.value ?? null;
    },
    async del(key: string) {
      const deleted = store.delete(key);
      return deleted ? 1 : 0;
    },
    async ttl(key: string) {
      const entry = store.get(key);
      if (!entry) return -2;
      return entry.ttl ?? -1;
    },
    // Test helper
    __getStore: () => store,
    __clear: () => store.clear(),
  };
}

describe('RegistrationTokenStore', () => {
  let mockRedis: ReturnType<typeof createMockRedis>;
  let tokenStore: RegistrationTokenStore;

  beforeEach(() => {
    mockRedis = createMockRedis();
    tokenStore = new RegistrationTokenStore(mockRedis as any, { defaultTtlDays: 30 });
  });

  afterEach(() => {
    mockRedis.__clear();
    vi.useRealTimers();
  });

  describe('createToken', () => {
    it('returns a base64url-encoded token', async () => {
      const { token } = await tokenStore.createToken('client-123');

      // base64url should match pattern
      expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
      // 32 bytes = 43 characters in base64url (no padding)
      expect(token.length).toBe(43);
    });

    it('generates unique tokens for each call', async () => {
      const result1 = await tokenStore.createToken('client-1');
      const result2 = await tokenStore.createToken('client-2');

      expect(result1.token).not.toBe(result2.token);
    });

    it('stores the token hash, not the plaintext', async () => {
      const { token } = await tokenStore.createToken('client-123');

      const storedData = mockRedis.__getStore().get('reg_token:client-123');
      expect(storedData).toBeDefined();

      const record: RegistrationTokenRecord = JSON.parse(storedData!.value);

      // Verify hash is stored
      const expectedHash = createHash('sha256').update(token).digest('hex');
      expect(record.tokenHash).toBe(expectedHash);

      // Verify plaintext is NOT stored
      expect(record.tokenHash).not.toBe(token);
      expect(JSON.stringify(record)).not.toContain(token);
    });

    it('sets correct expiration timestamp', async () => {
      vi.useFakeTimers();
      const now = new Date('2025-01-01T00:00:00.000Z');
      vi.setSystemTime(now);

      const { expiresAt } = await tokenStore.createToken('client-123', { ttlDays: 7 });

      const expectedExpiry = now.getTime() + 7 * 24 * 60 * 60 * 1000;
      expect(expiresAt).toBe(expectedExpiry);
    });

    it('stores record with correct fields', async () => {
      vi.useFakeTimers();
      const now = new Date('2025-01-01T00:00:00.000Z');
      vi.setSystemTime(now);

      await tokenStore.createToken('client-123');

      const storedData = mockRedis.__getStore().get('reg_token:client-123');
      const record: RegistrationTokenRecord = JSON.parse(storedData!.value);

      expect(record.clientId).toBe('client-123');
      expect(record.issuedAt).toBe(now.getTime());
      expect(record.revoked).toBe(false);
    });

    it('respects custom TTL from options', async () => {
      const { expiresAt } = await tokenStore.createToken('client-123', { ttlDays: 90 });

      const expectedTtlMs = 90 * 24 * 60 * 60 * 1000;
      const actualTtlMs = expiresAt - Date.now();

      // Allow small delta for test execution time
      expect(actualTtlMs).toBeGreaterThan(expectedTtlMs - 1000);
      expect(actualTtlMs).toBeLessThanOrEqual(expectedTtlMs);
    });
  });

  describe('validateToken', () => {
    it('accepts valid token', async () => {
      const { token } = await tokenStore.createToken('client-123');

      const result = await tokenStore.validateToken('client-123', token);

      expect(result.valid).toBe(true);
      if (result.valid) {
        expect(result.record.clientId).toBe('client-123');
      }
    });

    it('rejects wrong token', async () => {
      await tokenStore.createToken('client-123');

      const result = await tokenStore.validateToken('client-123', 'wrong-token-value');

      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toBe('invalid');
      }
    });

    it('rejects token for wrong client', async () => {
      const { token } = await tokenStore.createToken('client-123');

      // Try to validate against different client
      const result = await tokenStore.validateToken('client-456', token);

      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toBe('not_found');
      }
    });

    it('rejects expired token', async () => {
      vi.useFakeTimers();
      const now = new Date('2025-01-01T00:00:00.000Z');
      vi.setSystemTime(now);

      const { token } = await tokenStore.createToken('client-123', { ttlDays: 1 });

      // Advance time past expiration
      vi.advanceTimersByTime(2 * 24 * 60 * 60 * 1000); // 2 days

      const result = await tokenStore.validateToken('client-123', token);

      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toBe('expired');
      }
    });

    it('rejects revoked token', async () => {
      const { token } = await tokenStore.createToken('client-123');

      await tokenStore.revokeToken('client-123');

      const result = await tokenStore.validateToken('client-123', token);

      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toBe('revoked');
      }
    });

    it('returns not_found for non-existent client', async () => {
      const result = await tokenStore.validateToken('nonexistent-client', 'some-token');

      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toBe('not_found');
      }
    });

    it('handles corrupted stored data', async () => {
      // Store corrupted data directly
      await mockRedis.setex('reg_token:client-123', 86400, 'not-valid-json');

      const result = await tokenStore.validateToken('client-123', 'some-token');

      expect(result.valid).toBe(false);
      if (!result.valid) {
        expect(result.reason).toBe('not_found');
      }
    });
  });

  describe('revokeToken', () => {
    it('marks token as revoked', async () => {
      await tokenStore.createToken('client-123');

      const result = await tokenStore.revokeToken('client-123');

      expect(result).toBe(true);

      const storedData = mockRedis.__getStore().get('reg_token:client-123');
      const record: RegistrationTokenRecord = JSON.parse(storedData!.value);
      expect(record.revoked).toBe(true);
    });

    it('returns true if already revoked', async () => {
      await tokenStore.createToken('client-123');
      await tokenStore.revokeToken('client-123');

      // Revoke again
      const result = await tokenStore.revokeToken('client-123');

      expect(result).toBe(true);
    });

    it('returns false for non-existent client', async () => {
      const result = await tokenStore.revokeToken('nonexistent-client');

      expect(result).toBe(false);
    });
  });

  describe('getTokenForClient', () => {
    it('returns token record for existing client', async () => {
      await tokenStore.createToken('client-123');

      const record = await tokenStore.getTokenForClient('client-123');

      expect(record).not.toBeNull();
      expect(record?.clientId).toBe('client-123');
    });

    it('returns null for non-existent client', async () => {
      const record = await tokenStore.getTokenForClient('nonexistent-client');

      expect(record).toBeNull();
    });
  });

  describe('deleteToken', () => {
    it('deletes existing token', async () => {
      await tokenStore.createToken('client-123');

      const result = await tokenStore.deleteToken('client-123');

      expect(result).toBe(true);
      expect(mockRedis.__getStore().has('reg_token:client-123')).toBe(false);
    });

    it('returns false for non-existent token', async () => {
      const result = await tokenStore.deleteToken('nonexistent-client');

      expect(result).toBe(false);
    });
  });

  describe('security properties', () => {
    it('uses timing-safe comparison (verified by implementation)', async () => {
      // The implementation uses crypto.timingSafeEqual
      // This test verifies the comparison works correctly for both matching and non-matching hashes

      const { token } = await tokenStore.createToken('client-123');

      // Valid token should pass
      const validResult = await tokenStore.validateToken('client-123', token);
      expect(validResult.valid).toBe(true);

      // Invalid token should fail (not crash due to timing-safe comparison)
      const invalidResult = await tokenStore.validateToken('client-123', 'x'.repeat(43));
      expect(invalidResult.valid).toBe(false);
    });

    it('generates tokens with sufficient entropy', async () => {
      // Generate many tokens and verify uniqueness
      const tokens = new Set<string>();
      for (let i = 0; i < 100; i++) {
        const { token } = await tokenStore.createToken(`client-${i}`);
        expect(tokens.has(token)).toBe(false);
        tokens.add(token);
      }
    });

    it('token length indicates 256-bit entropy', async () => {
      const { token } = await tokenStore.createToken('client-123');

      // 256 bits / 6 bits per base64 char ≈ 43 chars (no padding in base64url)
      expect(token.length).toBe(43);

      // Decode and verify byte length
      const bytes = Buffer.from(token, 'base64url');
      expect(bytes.length).toBe(32); // 256 bits = 32 bytes
    });
  });
});
