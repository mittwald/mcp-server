import { logger } from './logger.js';
import type { ScopeResolutionSource } from './mittwald-metadata.js';

export interface UserAccount {
  accountId: string;
  mittwaldAccessToken: string;
  mittwaldRefreshToken?: string;
  createdAt: number;
  expiresAt?: number;
  subject?: string;
  email?: string;
  name?: string;
  mittwaldScope?: string;
  scopeSource?: ScopeResolutionSource;
  requestedScope?: string;
}

/**
 * Simple user account store for OAuth user sessions
 * Replaces complex custom interaction store with minimal user account mapping
 */
export class UserAccountStore {
  private accounts = new Map<string, UserAccount>();
  private timers = new Map<string, NodeJS.Timeout>();

  /**
   * Store user account with Mittwald tokens
   */
  store(accountId: string, account: UserAccount): void {
    this.accounts.set(accountId, account);

    logger.info('USER ACCOUNT: Stored Mittwald tokens', {
      accountId: accountId.substring(0, 16) + '...',
      hasAccessToken: !!account.mittwaldAccessToken,
      hasRefreshToken: !!account.mittwaldRefreshToken,
      expiresAt: account.expiresAt ? new Date(account.expiresAt).toISOString() : 'never',
      subject: account.subject,
      hasEmail: !!account.email,
      mittwaldScope: account.mittwaldScope,
      scopeSource: account.scopeSource,
    });

    // Set up automatic cleanup if expiration time provided
    if (account.expiresAt) {
      const ttl = account.expiresAt - Date.now();
      if (ttl > 0) {
        const timer = setTimeout(() => {
          this.accounts.delete(accountId);
          this.timers.delete(accountId);
          logger.info('USER ACCOUNT: Expired and cleaned up', {
            accountId: accountId.substring(0, 16) + '...'
          });
        }, ttl);

        this.timers.set(accountId, timer);
      }
    }
  }

  /**
   * Retrieve user account data
   */
  get(accountId: string): UserAccount | null {
    const account = this.accounts.get(accountId);

    if (account) {
      // Check if expired
      if (account.expiresAt && Date.now() > account.expiresAt) {
        this.remove(accountId);
        return null;
      }

      logger.info('USER ACCOUNT: Retrieved Mittwald tokens', {
        accountId: accountId.substring(0, 16) + '...',
        hasAccessToken: !!account.mittwaldAccessToken,
        ageMinutes: (Date.now() - account.createdAt) / (1000 * 60),
        subject: account.subject,
        mittwaldScope: account.mittwaldScope,
      });

      return account;
    }

    logger.warn('USER ACCOUNT: Not found', {
      accountId: accountId.substring(0, 16) + '...',
      storeSize: this.accounts.size
    });

    return null;
  }

  /**
   * Remove user account
   */
  remove(accountId: string): boolean {
    const removed = this.accounts.delete(accountId);

    // Clear expiration timer if exists
    const timer = this.timers.get(accountId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(accountId);
    }

    if (removed) {
      logger.info('USER ACCOUNT: Removed', {
        accountId: accountId.substring(0, 16) + '...'
      });
    }

    return removed;
  }

  /**
   * Get current store size (for monitoring)
   */
  size(): number {
    return this.accounts.size;
  }

  /**
   * Clear all accounts (for testing)
   */
  clear(): void {
    // Clear all timers
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }

    const size = this.accounts.size;
    this.accounts.clear();
    this.timers.clear();

    logger.info('USER ACCOUNT: Cleared all accounts', { previousSize: size });
  }
}

// Global singleton instance for simple access
export const userAccountStore = new UserAccountStore();
