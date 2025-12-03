/**
 * Unit tests for StateStore implementations
 *
 * Tests cover:
 * - Single-use state enforcement (getAndConsumeState)
 * - PKCE validation (empty codeChallenge rejection)
 * - State expiration handling
 * - Backward compatibility with existing records
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MemoryStateStore } from '../../src/state/memory-state-store.js';
import type { AuthorizationRequestRecord } from '../../src/state/state-store.js';

function createValidAuthRequest(overrides: Partial<AuthorizationRequestRecord> = {}): AuthorizationRequestRecord {
  return {
    state: 'external-state-123',
    internalState: 'internal-state-' + Math.random().toString(36).substring(7),
    clientId: 'test-client',
    redirectUri: 'https://example.com/callback',
    codeChallenge: 'valid-code-challenge-base64url-encoded-value',
    codeChallengeMethod: 'S256',
    scope: 'openid profile',
    createdAt: Date.now(),
    expiresAt: Date.now() + 600000, // 10 minutes
    ...overrides,
  };
}

describe('MemoryStateStore', () => {
  let store: MemoryStateStore;

  beforeEach(() => {
    store = new MemoryStateStore({ ttlMs: 60 * 1000 });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('storeAuthorizationRequest', () => {
    it('stores a valid authorization request', async () => {
      const record = createValidAuthRequest();

      await store.storeAuthorizationRequest(record);

      const retrieved = await store.getAuthorizationRequestByInternalState(record.internalState);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.clientId).toBe(record.clientId);
    });

    it('rejects empty codeChallenge', async () => {
      const record = createValidAuthRequest({ codeChallenge: '' });

      await expect(store.storeAuthorizationRequest(record)).rejects.toThrow(
        'codeChallenge is required and cannot be empty'
      );
    });

    it('rejects undefined codeChallenge', async () => {
      const record = createValidAuthRequest();
      // @ts-expect-error - Testing runtime validation
      record.codeChallenge = undefined;

      await expect(store.storeAuthorizationRequest(record)).rejects.toThrow(
        'codeChallenge is required and cannot be empty'
      );
    });

    it('sets consumed flag to false on store', async () => {
      const record = createValidAuthRequest();

      await store.storeAuthorizationRequest(record);

      const retrieved = await store.getAuthorizationRequestByInternalState(record.internalState);
      expect(retrieved?.consumed).toBe(false);
    });
  });

  describe('getAndConsumeState', () => {
    it('returns record on first call', async () => {
      const record = createValidAuthRequest();
      await store.storeAuthorizationRequest(record);

      const result = await store.getAndConsumeState(record.internalState);

      expect(result).not.toBeNull();
      expect(result?.clientId).toBe(record.clientId);
      expect(result?.state).toBe(record.state);
    });

    it('returns null on second call (single-use enforcement)', async () => {
      const record = createValidAuthRequest();
      await store.storeAuthorizationRequest(record);

      // First call should succeed
      const firstResult = await store.getAndConsumeState(record.internalState);
      expect(firstResult).not.toBeNull();

      // Second call should return null (already consumed)
      const secondResult = await store.getAndConsumeState(record.internalState);
      expect(secondResult).toBeNull();
    });

    it('returns null for non-existent state', async () => {
      const result = await store.getAndConsumeState('non-existent-state');
      expect(result).toBeNull();
    });

    it('returns null for expired state', async () => {
      vi.useFakeTimers();
      const now = new Date('2025-01-01T00:00:00.000Z');
      vi.setSystemTime(now);

      const record = createValidAuthRequest();
      await store.storeAuthorizationRequest(record);

      // Advance time past expiration (TTL is 60 seconds)
      vi.advanceTimersByTime(120 * 1000); // 2 minutes

      const result = await store.getAndConsumeState(record.internalState);
      expect(result).toBeNull();
    });

    it('deletes record after consumption', async () => {
      const record = createValidAuthRequest();
      await store.storeAuthorizationRequest(record);

      await store.getAndConsumeState(record.internalState);

      // Regular get should also return null now
      const retrieved = await store.getAuthorizationRequestByInternalState(record.internalState);
      expect(retrieved).toBeNull();
    });
  });

  describe('getAuthorizationRequestByInternalState', () => {
    it('returns record without consuming it', async () => {
      const record = createValidAuthRequest();
      await store.storeAuthorizationRequest(record);

      // Multiple calls should all succeed
      const first = await store.getAuthorizationRequestByInternalState(record.internalState);
      const second = await store.getAuthorizationRequestByInternalState(record.internalState);

      expect(first).not.toBeNull();
      expect(second).not.toBeNull();
      expect(first?.clientId).toBe(second?.clientId);
    });

    it('returns null for non-existent state', async () => {
      const result = await store.getAuthorizationRequestByInternalState('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('deleteAuthorizationRequestByInternalState', () => {
    it('deletes existing record', async () => {
      const record = createValidAuthRequest();
      await store.storeAuthorizationRequest(record);

      await store.deleteAuthorizationRequestByInternalState(record.internalState);

      const retrieved = await store.getAuthorizationRequestByInternalState(record.internalState);
      expect(retrieved).toBeNull();
    });

    it('does not throw for non-existent record', async () => {
      await expect(
        store.deleteAuthorizationRequestByInternalState('non-existent')
      ).resolves.not.toThrow();
    });
  });

  describe('replay attack prevention', () => {
    it('prevents state reuse after successful consumption', async () => {
      const record = createValidAuthRequest();
      await store.storeAuthorizationRequest(record);

      // Simulate legitimate callback
      const legitimate = await store.getAndConsumeState(record.internalState);
      expect(legitimate).not.toBeNull();

      // Simulate replay attack with same state
      const replay = await store.getAndConsumeState(record.internalState);
      expect(replay).toBeNull();
    });

    it('each state can only complete one OAuth flow', async () => {
      const state = createValidAuthRequest();
      await store.storeAuthorizationRequest(state);

      // Multiple "parallel" attempts to use same state
      const [first, second, third] = await Promise.all([
        store.getAndConsumeState(state.internalState),
        store.getAndConsumeState(state.internalState),
        store.getAndConsumeState(state.internalState),
      ]);

      // Only one should succeed (race condition, but one will win)
      const successes = [first, second, third].filter((r) => r !== null);
      expect(successes.length).toBe(1);
    });
  });
});
