/**
 * Factory for creating RegistrationTokenStore instances.
 *
 * Creates the appropriate store based on environment configuration.
 * The token store requires Redis for production use; in-memory fallback
 * is not supported for security tokens.
 */

import Redis from 'ioredis';
import { RegistrationTokenStore } from './registration-token-store.js';

interface CreateRegistrationTokenStoreOptions {
  defaultTtlDays?: number;
}

/**
 * Creates a RegistrationTokenStore instance.
 *
 * Uses Redis for storage (same instance configuration as the state store).
 * Token store requires Redis - there is no in-memory fallback because
 * registration tokens must persist across server restarts.
 *
 * Environment variables:
 * - DCR_TOKEN_TTL_DAYS: Token TTL in days (default: 30)
 * - BRIDGE_REDIS_URL or REDIS_URL: Redis connection URL
 *
 * @param options - Configuration options
 * @returns A configured RegistrationTokenStore instance
 */
export function createRegistrationTokenStore(
  options: CreateRegistrationTokenStoreOptions = {}
): RegistrationTokenStore {
  const redisUrl = process.env.BRIDGE_REDIS_URL
    || process.env.REDIS_URL
    || 'redis://localhost:6379';

  const defaultTtlDays = options.defaultTtlDays
    ?? Number(process.env.DCR_TOKEN_TTL_DAYS || 30);

  const redis = new Redis(redisUrl);

  return new RegistrationTokenStore(redis, { defaultTtlDays });
}
