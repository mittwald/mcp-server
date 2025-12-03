/**
 * Unit tests for PKCE validation at state storage level
 *
 * Tests verify that code_challenge validation happens when storing
 * authorization requests, not just at token exchange time.
 *
 * Per RFC 7636:
 * - code_challenge for S256 must be BASE64URL(SHA256(code_verifier))
 * - SHA-256 produces 32 bytes, which base64url encodes to exactly 43 characters
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryStateStore } from '../../src/state/memory-state-store.js';
import { createHash, randomBytes } from 'node:crypto';
import type { AuthorizationRequestRecord } from '../../src/state/state-store.js';

function generateValidCodeChallenge(verifier: string): string {
  return createHash('sha256')
    .update(verifier)
    .digest('base64url');
}

/**
 * Generates a valid code_verifier per RFC 7636 (43-128 chars, base64url)
 */
function generateValidCodeVerifier(): string {
  return randomBytes(48)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function createAuthorizationRequest(overrides: Partial<AuthorizationRequestRecord> = {}): AuthorizationRequestRecord {
  const validVerifier = 'a'.repeat(43) + randomBytes(8).toString('hex');
  const validChallenge = generateValidCodeChallenge(validVerifier);
  const validMittwaldCodeVerifier = generateValidCodeVerifier();

  return {
    state: `state-${randomBytes(8).toString('hex')}`,
    internalState: `internal-${randomBytes(8).toString('hex')}`,
    clientId: 'test-client',
    redirectUri: 'https://example.com/callback',
    codeChallenge: validChallenge,
    codeChallengeMethod: 'S256',
    mittwaldCodeVerifier: validMittwaldCodeVerifier,
    scope: 'openid',
    createdAt: Date.now(),
    expiresAt: Date.now() + 600000,
    ...overrides,
  };
}

describe('State Store PKCE Validation', () => {
  let store: MemoryStateStore;

  beforeEach(() => {
    store = new MemoryStateStore({ ttlMs: 60 * 1000 });
  });

  describe('code_challenge validation on storage', () => {
    it('accepts valid S256 code_challenge (43 chars)', async () => {
      const verifier = 'a'.repeat(64); // Valid 64-char verifier
      const challenge = generateValidCodeChallenge(verifier);

      expect(challenge.length).toBe(43); // SHA-256 base64url = 43 chars

      const record = createAuthorizationRequest({
        codeChallenge: challenge,
      });

      await expect(store.storeAuthorizationRequest(record)).resolves.not.toThrow();
    });

    it('rejects empty code_challenge', async () => {
      const record = createAuthorizationRequest({
        codeChallenge: '',
      });

      await expect(store.storeAuthorizationRequest(record)).rejects.toThrow(
        'codeChallenge is required and cannot be empty'
      );
    });

    it('rejects code_challenge that is too short', async () => {
      const record = createAuthorizationRequest({
        codeChallenge: 'a'.repeat(42), // Too short
      });

      await expect(store.storeAuthorizationRequest(record)).rejects.toThrow(
        'code_challenge for S256 must be 43 characters'
      );
    });

    it('rejects code_challenge that is too long', async () => {
      const record = createAuthorizationRequest({
        codeChallenge: 'a'.repeat(44), // Too long
      });

      await expect(store.storeAuthorizationRequest(record)).rejects.toThrow(
        'code_challenge for S256 must be 43 characters'
      );
    });

    it('rejects code_challenge with invalid base64url characters', async () => {
      const record = createAuthorizationRequest({
        codeChallenge: 'a'.repeat(40) + '+/=', // Invalid chars (regular base64)
      });

      await expect(store.storeAuthorizationRequest(record)).rejects.toThrow(
        'code_challenge must be base64url encoded'
      );
    });

    it('rejects code_challenge with spaces', async () => {
      const record = createAuthorizationRequest({
        codeChallenge: 'a'.repeat(40) + ' b ',
      });

      await expect(store.storeAuthorizationRequest(record)).rejects.toThrow(
        'code_challenge must be base64url encoded'
      );
    });

    it('accepts code_challenge with valid base64url chars (A-Z, a-z, 0-9, -, _)', async () => {
      // Construct a valid 43-char base64url string
      const validBase64url = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklm-_01';
      expect(validBase64url.length).toBe(43);

      const record = createAuthorizationRequest({
        codeChallenge: validBase64url,
      });

      await expect(store.storeAuthorizationRequest(record)).resolves.not.toThrow();
    });
  });

  describe('validates before storing', () => {
    it('does not store record with invalid code_challenge', async () => {
      const record = createAuthorizationRequest({
        codeChallenge: 'invalid',
      });

      await expect(store.storeAuthorizationRequest(record)).rejects.toThrow();

      // Verify nothing was stored
      const retrieved = await store.getAuthorizationRequestByInternalState(record.internalState);
      expect(retrieved).toBeNull();
    });
  });

  describe('mittwaldCodeVerifier validation on storage (FR-005)', () => {
    it('accepts valid mittwaldCodeVerifier (64 chars)', async () => {
      const verifier = generateValidCodeVerifier();
      expect(verifier.length).toBeGreaterThanOrEqual(43);
      expect(verifier.length).toBeLessThanOrEqual(128);

      const record = createAuthorizationRequest({
        mittwaldCodeVerifier: verifier,
      });

      await expect(store.storeAuthorizationRequest(record)).resolves.not.toThrow();
    });

    it('rejects empty mittwaldCodeVerifier', async () => {
      const record = createAuthorizationRequest({
        mittwaldCodeVerifier: '',
      });

      await expect(store.storeAuthorizationRequest(record)).rejects.toThrow(
        'mittwaldCodeVerifier is required and cannot be empty (FR-005)'
      );
    });

    it('rejects undefined mittwaldCodeVerifier', async () => {
      const record = createAuthorizationRequest();
      // @ts-expect-error - Testing runtime validation
      record.mittwaldCodeVerifier = undefined;

      await expect(store.storeAuthorizationRequest(record)).rejects.toThrow(
        'mittwaldCodeVerifier is required and cannot be empty (FR-005)'
      );
    });

    it('rejects mittwaldCodeVerifier shorter than 43 chars', async () => {
      const record = createAuthorizationRequest({
        mittwaldCodeVerifier: 'a'.repeat(42), // Too short
      });

      await expect(store.storeAuthorizationRequest(record)).rejects.toThrow(
        'mittwaldCodeVerifier must be 43-128 characters'
      );
    });

    it('rejects mittwaldCodeVerifier longer than 128 chars', async () => {
      const record = createAuthorizationRequest({
        mittwaldCodeVerifier: 'a'.repeat(129), // Too long
      });

      await expect(store.storeAuthorizationRequest(record)).rejects.toThrow(
        'mittwaldCodeVerifier must be 43-128 characters'
      );
    });

    it('accepts mittwaldCodeVerifier with exactly 43 chars (minimum)', async () => {
      const record = createAuthorizationRequest({
        mittwaldCodeVerifier: 'a'.repeat(43),
      });

      await expect(store.storeAuthorizationRequest(record)).resolves.not.toThrow();
    });

    it('accepts mittwaldCodeVerifier with exactly 128 chars (maximum)', async () => {
      const record = createAuthorizationRequest({
        mittwaldCodeVerifier: 'a'.repeat(128),
      });

      await expect(store.storeAuthorizationRequest(record)).resolves.not.toThrow();
    });

    it('rejects mittwaldCodeVerifier with invalid base64url chars', async () => {
      const record = createAuthorizationRequest({
        mittwaldCodeVerifier: 'a'.repeat(40) + '+/=', // Invalid chars (regular base64, not base64url)
      });

      await expect(store.storeAuthorizationRequest(record)).rejects.toThrow(
        'mittwaldCodeVerifier must be base64url encoded'
      );
    });

    it('rejects mittwaldCodeVerifier with spaces', async () => {
      const record = createAuthorizationRequest({
        mittwaldCodeVerifier: 'a'.repeat(40) + ' b ',
      });

      await expect(store.storeAuthorizationRequest(record)).rejects.toThrow(
        'mittwaldCodeVerifier must be base64url encoded'
      );
    });
  });

  describe('real-world code_challenge values', () => {
    it('accepts code_challenge derived from 43-char verifier (minimum)', async () => {
      const verifier = 'a'.repeat(43); // Minimum RFC 7636 length
      const challenge = generateValidCodeChallenge(verifier);

      const record = createAuthorizationRequest({
        codeChallenge: challenge,
      });

      await expect(store.storeAuthorizationRequest(record)).resolves.not.toThrow();
    });

    it('accepts code_challenge derived from 128-char verifier (maximum)', async () => {
      const verifier = 'z'.repeat(128); // Maximum RFC 7636 length
      const challenge = generateValidCodeChallenge(verifier);

      const record = createAuthorizationRequest({
        codeChallenge: challenge,
      });

      await expect(store.storeAuthorizationRequest(record)).resolves.not.toThrow();
    });

    it('all valid verifier lengths produce 43-char challenge', async () => {
      // Test various lengths - all should produce 43-char challenges
      for (const length of [43, 50, 64, 100, 128]) {
        const verifier = 'x'.repeat(length);
        const challenge = generateValidCodeChallenge(verifier);

        expect(challenge.length).toBe(43);

        const record = createAuthorizationRequest({
          codeChallenge: challenge,
          internalState: `internal-${length}`,
        });

        await expect(store.storeAuthorizationRequest(record)).resolves.not.toThrow();
      }
    });
  });
});
