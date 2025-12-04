import { createHash } from 'node:crypto';
import { logger } from '../utils/logger.js';
import { CONFIG } from './config.js';

const DIRECT_TOKEN_LOG_NAMESPACE = 'DirectTokenValidator';
const MITTWALD_API_BASE = 'https://api.mittwald.de/v2';

export interface DirectTokenValidationResult {
  userId: string;
  email?: string;
  name?: string;
}

interface ValidationCacheEntry {
  result: DirectTokenValidationResult;
  expiresAt: number;
}

interface MittwaldUserResponse {
  userId: string;
  email?: string;
  person?: {
    firstName?: string;
    lastName?: string;
  };
}

export class DirectTokenValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DirectTokenValidationError';
  }
}

class DirectTokenValidator {
  private cache = new Map<string, ValidationCacheEntry>();

  async validate(token: string): Promise<DirectTokenValidationResult> {
    const now = Date.now();
    this.pruneExpired(now);

    const cacheKey = this.hashToken(token);
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > now) {
      logger.debug(`[${DIRECT_TOKEN_LOG_NAMESPACE}] Cache hit for token`);
      return cached.result;
    }

    const validation = await this.validateViaRestApi(token);
    this.cache.set(cacheKey, {
      result: validation,
      expiresAt: now + CONFIG.DIRECT_TOKENS.CACHE_TTL_MS,
    });
    return validation;
  }

  clear(): void {
    this.cache.clear();
  }

  private pruneExpired(now: number): void {
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt <= now) {
        this.cache.delete(key);
      }
    }
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  /**
   * Validates a Mittwald API token by calling the /v2/users/self endpoint.
   * This is much lighter than spawning the CLI and scales to concurrent validations.
   */
  private async validateViaRestApi(token: string): Promise<DirectTokenValidationResult> {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      CONFIG.DIRECT_TOKENS.VALIDATION_TIMEOUT_MS
    );

    try {
      logger.debug(`[${DIRECT_TOKEN_LOG_NAMESPACE}] Validating token via REST API`);

      const response = await fetch(`${MITTWALD_API_BASE}/users/self`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          logger.warn(`[${DIRECT_TOKEN_LOG_NAMESPACE}] Token rejected by Mittwald API`, {
            status: response.status,
          });
          throw new DirectTokenValidationError('Mittwald API rejected the supplied token');
        }

        logger.warn(`[${DIRECT_TOKEN_LOG_NAMESPACE}] Mittwald API error`, {
          status: response.status,
          statusText: response.statusText,
        });
        throw new DirectTokenValidationError(`Mittwald API returned ${response.status}`);
      }

      const user = await response.json() as MittwaldUserResponse;

      if (!user.userId) {
        logger.error(`[${DIRECT_TOKEN_LOG_NAMESPACE}] Mittwald API response missing userId`);
        throw new DirectTokenValidationError('Invalid response from Mittwald API');
      }

      const name = user.person
        ? [user.person.firstName, user.person.lastName].filter(Boolean).join(' ')
        : undefined;

      logger.debug(`[${DIRECT_TOKEN_LOG_NAMESPACE}] Token validated successfully`, {
        userId: user.userId,
        hasEmail: Boolean(user.email),
      });

      return {
        userId: user.userId,
        email: user.email,
        name: name || undefined,
      };
    } catch (error) {
      if (error instanceof DirectTokenValidationError) {
        throw error;
      }

      if (error instanceof Error && error.name === 'AbortError') {
        logger.error(`[${DIRECT_TOKEN_LOG_NAMESPACE}] Validation timeout`);
        throw new DirectTokenValidationError('Token validation timed out');
      }

      logger.error(`[${DIRECT_TOKEN_LOG_NAMESPACE}] Unexpected validation error`, {
        error: error instanceof Error ? error.message : String(error),
      });
      throw new DirectTokenValidationError('Direct token validation failed');
    } finally {
      clearTimeout(timeout);
    }
  }
}

export const directTokenValidator = new DirectTokenValidator();
