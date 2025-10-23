import { createHash } from 'node:crypto';
import { executeCli } from '../utils/cli-wrapper.js';
import { logger } from '../utils/logger.js';
import { CONFIG } from './config.js';

const DIRECT_TOKEN_LOG_NAMESPACE = 'DirectTokenValidator';

export interface DirectTokenValidationResult {
  userId: string;
  email?: string;
  name?: string;
  rawOutput: string;
}

interface ValidationCacheEntry {
  result: DirectTokenValidationResult;
  expiresAt: number;
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
      return cached.result;
    }

    const validation = await this.runCliValidation(token);
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

  private async runCliValidation(token: string): Promise<DirectTokenValidationResult> {
    try {
      const execution = await executeCli(
        'mw',
        ['login', 'status', '--token', token],
        {
          timeout: CONFIG.DIRECT_TOKENS.VALIDATION_TIMEOUT_MS,
        }
      );

      if (execution.exitCode !== 0) {
        logger.warn(`[${DIRECT_TOKEN_LOG_NAMESPACE}] CLI validation failed`, {
          exitCode: execution.exitCode,
          stderr: execution.stderr,
        });
        throw new DirectTokenValidationError('Mittwald CLI rejected the supplied token');
      }

      const parsed = this.parseLoginStatus(execution.stdout.trim());
      logger.debug(`[${DIRECT_TOKEN_LOG_NAMESPACE}] Direct token validated`, {
        userId: parsed.userId,
        hasEmail: Boolean(parsed.email),
      });
      return {
        ...parsed,
        rawOutput: execution.stdout.trim(),
      };
    } catch (error) {
      if (error instanceof DirectTokenValidationError) {
        throw error;
      }
      logger.error(`[${DIRECT_TOKEN_LOG_NAMESPACE}] Unexpected token validation error`, {
        error: error instanceof Error ? error.message : String(error),
      });
      throw new DirectTokenValidationError('Direct token validation failed');
    }
  }

  private parseLoginStatus(output: string): Omit<DirectTokenValidationResult, 'rawOutput'> {
    const idMatch = output.match(/Id\s+([0-9a-f-]{36})/i);
    if (!idMatch) {
      throw new DirectTokenValidationError('Unable to extract user id from CLI output');
    }

    const emailMatch = output.match(/Email\s+([^\s]+)/i);
    const nameMatch = output.match(/Name\s+([^\n]+)/i);

    return {
      userId: idMatch[1],
      email: emailMatch?.[1],
      name: nameMatch?.[1]?.trim(),
    };
  }
}

export const directTokenValidator = new DirectTokenValidator();
