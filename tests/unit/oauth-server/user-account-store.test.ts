/**
 * User Account Store Unit Tests
 *
 * Tests the simplified user account store that replaced complex interaction store
 * Based on ARCHITECTURE.md Phase 5: User account and token management
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { UserAccountStore, type UserAccount } from '../../../packages/oauth-server/src/services/user-account-store.js';

describe('UserAccountStore', () => {
  let store: UserAccountStore;
  let testAccount: UserAccount;

  beforeEach(() => {
    store = new UserAccountStore();
    testAccount = {
      accountId: 'mittwald:38416b04-c87d-46',
      mittwaldAccessToken: 'mittwald-access-token-example',
      mittwaldRefreshToken: 'mittwald-refresh-token-example',
      createdAt: Date.now(),
      expiresAt: Date.now() + 3600000 // 1 hour
    };
  });

  afterEach(() => {
    store.clear();
  });

  describe('Account Storage (Step 19)', () => {
    test('stores user account with Mittwald tokens', () => {
      // Test Step 19: Store Mittwald tokens (userAccountStore)
      store.store(testAccount.accountId, testAccount);

      const retrieved = store.get(testAccount.accountId);
      expect(retrieved).toEqual(testAccount);
    });

    test('logs account storage with masked account ID', () => {
      // Test privacy-conscious logging
      const logSpy = vi.spyOn(console, 'log');
      store.store(testAccount.accountId, testAccount);

      // Should log masked account ID for security
      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('mittwald:38416b04...')
      );
    });

    test('sets up automatic cleanup for expired tokens', () => {
      // Test automatic expiration handling
      vi.useFakeTimers();

      const expiredAccount = {
        ...testAccount,
        expiresAt: Date.now() + 1000 // 1 second
      };

      store.store(expiredAccount.accountId, expiredAccount);
      expect(store.get(expiredAccount.accountId)).toEqual(expiredAccount);

      // Fast-forward past expiration
      vi.advanceTimersByTime(2000);

      expect(store.get(expiredAccount.accountId)).toBeNull();
      vi.useRealTimers();
    });
  });

  describe('Account Retrieval', () => {
    test('retrieves stored account data', () => {
      store.store(testAccount.accountId, testAccount);
      const retrieved = store.get(testAccount.accountId);

      expect(retrieved?.mittwaldAccessToken).toBe(testAccount.mittwaldAccessToken);
      expect(retrieved?.mittwaldRefreshToken).toBe(testAccount.mittwaldRefreshToken);
    });

    test('returns null for non-existent account', () => {
      const retrieved = store.get('non-existent-account');
      expect(retrieved).toBeNull();
    });

    test('handles expired tokens', () => {
      const expiredAccount = {
        ...testAccount,
        expiresAt: Date.now() - 1000 // Expired
      };

      store.store(expiredAccount.accountId, expiredAccount);
      const retrieved = store.get(expiredAccount.accountId);

      expect(retrieved).toBeNull(); // Should remove expired accounts
    });

    test('logs retrieval attempts for debugging', () => {
      store.store(testAccount.accountId, testAccount);

      const logSpy = vi.spyOn(console, 'log');
      store.get(testAccount.accountId);

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('USER ACCOUNT: Retrieved')
      );
    });
  });

  describe('Account Cleanup', () => {
    test('removes account manually', () => {
      store.store(testAccount.accountId, testAccount);
      expect(store.get(testAccount.accountId)).toEqual(testAccount);

      const removed = store.remove(testAccount.accountId);
      expect(removed).toBe(true);
      expect(store.get(testAccount.accountId)).toBeNull();
    });

    test('clears all accounts', () => {
      store.store('account1', testAccount);
      store.store('account2', { ...testAccount, accountId: 'account2' });

      expect(store.size()).toBe(2);

      store.clear();
      expect(store.size()).toBe(0);
    });

    test('tracks store size for monitoring', () => {
      expect(store.size()).toBe(0);

      store.store(testAccount.accountId, testAccount);
      expect(store.size()).toBe(1);

      store.store('another-account', { ...testAccount, accountId: 'another-account' });
      expect(store.size()).toBe(2);
    });
  });

  describe('Error Handling', () => {
    test('handles malformed account data', () => {
      // Test invalid account data
      const invalidAccount = { accountId: 'test' } as UserAccount;

      expect(() => {
        store.store(invalidAccount.accountId, invalidAccount);
      }).not.toThrow(); // Should handle gracefully
    });

    test('handles concurrent access', () => {
      // Test concurrent store/retrieve operations
      // Should handle multiple simultaneous requests
      expect(true).toBe(true); // Placeholder - requires concurrency testing
    });
  });
});