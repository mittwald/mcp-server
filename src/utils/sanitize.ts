import { createHash } from 'crypto';

/**
 * Set of sensitive keys that should be redacted from logs.
 * Extracted from packages/oauth-bridge/src/middleware/request-logger.ts
 */
export const SENSITIVE_KEYS = new Set([
  'authorization',
  'client_secret',
  'code',
  'code_verifier',
  'registration_access_token',
  'refresh_token',
  'access_token',
  'token',
  'password',
  'apiKey',
  'api_key',
  'apiToken',
  'api_token',
  'accessToken',
  'access_token',
  'refreshToken',
  'refresh_token',
  'secret',
  'phoneNumber',
  'ssn',
]);

/**
 * Recursively sanitize an object by redacting sensitive values.
 * Sensitive keys are replaced with '[REDACTED:hash]' where hash is SHA256(value).
 */
export function sanitizeValue(value: unknown): unknown {
  // Handle primitives
  if (value === null || value === undefined) return value;
  if (typeof value !== 'object') return value;

  // Handle Buffers
  if (value instanceof Buffer) return '[Buffer]';
  if (typeof value === 'function') return '[Function]';

  // Handle arrays
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  // Handle objects
  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value)) {
    const isSensitive = SENSITIVE_KEYS.has(key.toLowerCase());

    if (isSensitive) {
      // Hash instead of fully redacting (allows deduplication debugging)
      result[key] = typeof val === 'string'
        ? `[REDACTED:${hashValue(val)}]`
        : '[REDACTED]';
    } else {
      result[key] = sanitizeValue(val);
    }
  }
  return result;
}

/**
 * Hash a value for redaction (first 8 chars of SHA256).
 * Allows debugging duplicate values without exposing actual content.
 */
function hashValue(value: string): string {
  return createHash('sha256')
    .update(value)
    .digest('hex')
    .substring(0, 8);
}
