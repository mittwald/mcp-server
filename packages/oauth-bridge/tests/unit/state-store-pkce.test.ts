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

function createAuthorizationRequest(overrides: Partial<AuthorizationRequestRecord> = {}): AuthorizationRequestRecord {
  const validVerifier = 'a'.repeat(43) + randomBytes(8).toString('hex');
  const validChallenge = generateValidCodeChallenge(validVerifier);

  return {
    state: `state-${randomBytes(8).toString('hex')}`,
    internalState: `internal-${randomBytes(8).toString('hex')}`,
    clientId: 'test-client',
    redirectUri: 'https://example.com/callback',
    codeChallenge: validChallenge,
    codeChallengeMethod: 'S256',
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
