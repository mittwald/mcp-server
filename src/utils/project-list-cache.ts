/**
 * @file Project list caching service
 * @module utils/project-list-cache
 *
 * @remarks
 * Caches project list results per session to avoid expensive CLI calls.
 * The Mittwald CLI 'project list' command can take 90+ seconds for users
 * with many projects, causing OOM issues on low-memory machines.
 *
 * Cache Strategy:
 * - Per-session caching (different users see different projects)
 * - Configurable TTL (default: 5 minutes)
 * - Automatic expiration
 * - Manual invalidation support
 */

import { logger } from './logger.js';
import { projectListCacheHits, projectListCacheMisses, projectListCacheSize } from '../metrics/index.js';

interface CachedProjectList {
  data: string; // JSON string of project list
  cachedAt: Date;
  expiresAt: Date;
}

export class ProjectListCache {
  private cache = new Map<string, CachedProjectList>();
  private readonly defaultTTLMs: number;

  constructor(ttlSeconds: number = 300) { // Default 5 minutes
    this.defaultTTLMs = ttlSeconds * 1000;
    logger.info(`[ProjectListCache] Initialized with TTL: ${ttlSeconds}s`);

    // Cleanup expired entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Get cached project list for a session
   * @param sessionId - User session ID
   * @returns Cached JSON string or undefined if not cached/expired
   */
  get(sessionId: string): string | undefined {
    const entry = this.cache.get(sessionId);

    if (!entry) {
      projectListCacheMisses.inc();
      return undefined;
    }

    // Check if expired
    if (new Date() > entry.expiresAt) {
      logger.debug(`[ProjectListCache] Cache expired for session ${sessionId}`);
      this.cache.delete(sessionId);
      projectListCacheSize.set(this.cache.size);
      projectListCacheMisses.inc();
      return undefined;
    }

    logger.debug(`[ProjectListCache] Cache hit for session ${sessionId}`);
    projectListCacheHits.inc();
    return entry.data;
  }

  /**
   * Cache project list for a session
   * @param sessionId - User session ID
   * @param data - JSON string of project list
   * @param customTTLSeconds - Optional custom TTL (overrides default)
   */
  set(sessionId: string, data: string, customTTLSeconds?: number): void {
    const ttlMs = customTTLSeconds ? customTTLSeconds * 1000 : this.defaultTTLMs;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlMs);

    this.cache.set(sessionId, {
      data,
      cachedAt: now,
      expiresAt,
    });

    projectListCacheSize.set(this.cache.size);
    logger.debug(`[ProjectListCache] Cached for session ${sessionId}, expires in ${ttlMs / 1000}s`);
  }

  /**
   * Invalidate cache for a specific session
   * @param sessionId - User session ID
   */
  invalidate(sessionId: string): void {
    const deleted = this.cache.delete(sessionId);
    if (deleted) {
      logger.info(`[ProjectListCache] Invalidated cache for session ${sessionId}`);
    }
  }

  /**
   * Clear all cached entries
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    logger.info(`[ProjectListCache] Cleared all ${size} cached entries`);
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    totalEntries: number;
    activeEntries: number;
    expiredEntries: number;
  } {
    const now = new Date();
    let active = 0;
    let expired = 0;

    for (const entry of this.cache.values()) {
      if (now > entry.expiresAt) {
        expired++;
      } else {
        active++;
      }
    }

    return {
      totalEntries: this.cache.size,
      activeEntries: active,
      expiredEntries: expired,
    };
  }

  /**
   * Remove expired entries from cache
   */
  private cleanup(): void {
    const now = new Date();
    let removed = 0;

    for (const [sessionId, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(sessionId);
        removed++;
      }
    }

    if (removed > 0) {
      logger.debug(`[ProjectListCache] Cleanup: removed ${removed} expired entries`);
    }
  }
}

// Singleton instance
export const projectListCache = new ProjectListCache(
  parseInt(process.env.PROJECT_LIST_CACHE_TTL_SECONDS || '300', 10)
);
