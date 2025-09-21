export interface AuthCodeData {
  code: string;
  accountId: string;
  accessToken: string;
  refreshToken?: string;
  clientId: string;
  redirectUri: string;
  createdAt: number;
  expiresAt: number;
}

/**
 * In-memory authorization code store with TTL support
 * This is a temporary implementation - in production, use Redis or database
 */
export class AuthCodeStore {
  private codes = new Map<string, AuthCodeData>();
  private timers = new Map<string, NodeJS.Timeout>();

  /**
   * Store an authorization code with automatic expiration
   */
  store(code: string, data: AuthCodeData): void {
    // Store the data
    this.codes.set(code, data);

    // Set up automatic expiration
    const ttl = data.expiresAt - Date.now();
    if (ttl > 0) {
      const timer = setTimeout(() => {
        this.codes.delete(code);
        this.timers.delete(code);
      }, ttl);

      this.timers.set(code, timer);
    } else {
      // Already expired, don't store
      this.codes.delete(code);
    }
  }

  /**
   * Retrieve and consume an authorization code (one-time use)
   */
  retrieve(code: string): AuthCodeData | null {
    const data = this.codes.get(code);
    if (data) {
      // Remove from store (one-time use)
      this.codes.delete(code);

      // Clear expiration timer
      const timer = this.timers.get(code);
      if (timer) {
        clearTimeout(timer);
        this.timers.delete(code);
      }

      // Check if expired
      if (Date.now() > data.expiresAt) {
        return null;
      }

      return data;
    }
    return null;
  }

  /**
   * Check if a code exists without consuming it
   */
  exists(code: string): boolean {
    const data = this.codes.get(code);
    if (data && Date.now() <= data.expiresAt) {
      return true;
    }
    return false;
  }

  /**
   * Get current count of stored codes (for monitoring)
   */
  size(): number {
    return this.codes.size;
  }

  /**
   * Clean up expired codes manually (called periodically)
   */
  cleanup(): number {
    const now = Date.now();
    let removed = 0;

    for (const [code, data] of this.codes.entries()) {
      if (now > data.expiresAt) {
        this.codes.delete(code);

        const timer = this.timers.get(code);
        if (timer) {
          clearTimeout(timer);
          this.timers.delete(code);
        }

        removed++;
      }
    }

    return removed;
  }

  /**
   * Clear all codes (for testing)
   */
  clear(): void {
    // Clear all timers
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }

    this.codes.clear();
    this.timers.clear();
  }
}

// Global singleton instance
export const authCodeStore = new AuthCodeStore();

// Periodic cleanup every 5 minutes
setInterval(() => {
  const removed = authCodeStore.cleanup();
  if (removed > 0) {
    console.log(`Cleaned up ${removed} expired authorization codes`);
  }
}, 5 * 60 * 1000);