import { logger } from './logger.js';

export interface MittwaldUserTokens {
  accessToken: string;
  refreshToken?: string;
  accountId: string;
  email?: string;
  name?: string;
  issuedAt: number;
  expiresAt?: number;
}

/**
 * Storage for Mittwald tokens keyed by user account ID
 * Used by oidc-provider's findAccount function
 */
export class MittwaldTokenStore {
  private tokens = new Map<string, MittwaldUserTokens>();

  /**
   * Store Mittwald tokens for a user account
   */
  store(accountId: string, tokens: MittwaldUserTokens): void {
    this.tokens.set(accountId, tokens);

    logger.info('MITTWALD TOKENS: Stored for user', {
      accountId: accountId.substring(0, 16) + '...',
      hasAccessToken: !!tokens.accessToken,
      hasRefreshToken: !!tokens.refreshToken,
      issuedAt: new Date(tokens.issuedAt).toISOString()
    });
  }

  /**
   * Retrieve Mittwald tokens for a user account
   */
  get(accountId: string): MittwaldUserTokens | null {
    const tokens = this.tokens.get(accountId);

    if (tokens) {
      logger.info('MITTWALD TOKENS: Retrieved for user', {
        accountId: accountId.substring(0, 16) + '...',
        hasAccessToken: !!tokens.accessToken,
        isExpired: tokens.expiresAt ? Date.now() > tokens.expiresAt : false
      });
    } else {
      logger.warn('MITTWALD TOKENS: Not found for user', {
        accountId: accountId.substring(0, 16) + '...',
        storeSize: this.tokens.size
      });
    }

    return tokens || null;
  }

  /**
   * Remove tokens for a user (logout/revoke)
   */
  remove(accountId: string): boolean {
    const removed = this.tokens.delete(accountId);

    if (removed) {
      logger.info('MITTWALD TOKENS: Removed for user', {
        accountId: accountId.substring(0, 16) + '...'
      });
    }

    return removed;
  }

  /**
   * Get current store size (for monitoring)
   */
  size(): number {
    return this.tokens.size;
  }

  /**
   * Clear all tokens (for testing)
   */
  clear(): void {
    const size = this.tokens.size;
    this.tokens.clear();
    logger.info('MITTWALD TOKENS: Cleared all tokens', { previousSize: size });
  }
}

// Global singleton instance
export const mittwaldTokenStore = new MittwaldTokenStore();