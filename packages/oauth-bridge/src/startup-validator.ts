/**
 * Startup Security Validator
 *
 * Prevents production deployment with placeholder secrets or insecure CORS configuration.
 * In development mode, logs warnings but allows startup to continue.
 * In production mode, throws errors and prevents server startup.
 *
 * Per spec FR-006, FR-007:
 * - Detect placeholder secrets from example configs
 * - Block CORS wildcard in production
 * - Exit with clear error messages
 */

import pino from 'pino';

const logger = pino({ level: process.env.LOG_LEVEL ?? 'info' });

/**
 * Custom error for startup validation failures.
 * Allows caller to distinguish validation errors from other errors.
 */
export class StartupValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StartupValidationError';
  }
}

/**
 * Known placeholder values from example configs (.env.example, fly.toml).
 * Values are compared case-insensitively.
 */
const PLACEHOLDER_SECRETS = [
  'development-jwt-secret-key-for-testing',
  'your-jwt-secret-here',
  'change-me-in-production',
  'placeholder',
  'secret',
  'changeme',
  'your-secret-key',
  'replace-this-secret',
  'super-secret',
  'test-secret',
  'example-secret',
];

/**
 * Regex patterns for common placeholder naming conventions.
 * Applied after exact match fails.
 */
const PLACEHOLDER_PATTERNS = [
  /^test[-_]?secret/i,
  /^dev[-_]?secret/i,
  /^example[-_]?/i,
  /^placeholder/i,
  /^changeme/i,
  /^xxx+$/i,
  /^your[-_]/i,
];

/**
 * Checks if a value looks like a placeholder secret.
 *
 * @param value - The secret value to check
 * @returns true if the value appears to be a placeholder
 */
export function isPlaceholder(value: string | undefined): boolean {
  if (!value) {
    return false;
  }

  const normalizedValue = value.toLowerCase().trim();

  // Check exact matches first
  if (PLACEHOLDER_SECRETS.includes(normalizedValue)) {
    return true;
  }

  // Check against patterns
  return PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(value));
}

/**
 * Validates CORS_ORIGIN is not wildcard in production.
 *
 * @throws StartupValidationError if CORS_ORIGIN is '*' in production
 */
function validateCorsOrigin(): void {
  const corsOrigin = process.env.CORS_ORIGIN;

  if (corsOrigin === '*') {
    throw new StartupValidationError(
      'CORS wildcard (*) not allowed in production - set CORS_ORIGIN to specific origin(s)'
    );
  }
}

/**
 * Environment variable names that contain secrets requiring validation.
 */
const SECRET_ENV_VARS = [
  'BRIDGE_JWT_SECRET',
  'JWT_SECRET',
  'OAUTH_BRIDGE_JWT_SECRET',
];

/**
 * Validates startup security configuration.
 *
 * In production (NODE_ENV=production):
 * - Throws StartupValidationError if any secret is a placeholder
 * - Throws StartupValidationError if CORS_ORIGIN is wildcard
 *
 * In development (any other NODE_ENV or unset):
 * - Logs warnings but allows startup to continue
 *
 * @throws StartupValidationError in production mode with invalid configuration
 */
export function validateSecrets(): void {
  const isProduction = process.env.NODE_ENV === 'production';
  const envMode = process.env.NODE_ENV ?? 'development';

  logger.debug({ isProduction, envMode }, 'Running startup security validation');

  // Check all secret environment variables
  for (const envVar of SECRET_ENV_VARS) {
    const value = process.env[envVar];

    if (isPlaceholder(value)) {
      if (isProduction) {
        throw new StartupValidationError(
          `Placeholder secret detected for ${envVar} - configure a secure random value before production deployment`
        );
      } else {
        logger.warn(
          { envVar },
          `[SECURITY] Placeholder secret detected for ${envVar} - this is OK for development only`
        );
      }
    }
  }

  // Check CORS configuration
  if (isProduction) {
    validateCorsOrigin();
  } else if (process.env.CORS_ORIGIN === '*') {
    logger.warn(
      '[SECURITY] CORS_ORIGIN is wildcard (*) - this is OK for development only'
    );
  }

  logger.debug('Startup security validation completed successfully');
}

/**
 * Runs startup validation with process exit on failure.
 * Should be called early in application startup, before accepting connections.
 */
export function runStartupValidation(): void {
  try {
    validateSecrets();
  } catch (error) {
    if (error instanceof StartupValidationError) {
      logger.error(`[STARTUP BLOCKED] ${error.message}`);
      logger.error(
        'Server startup aborted due to insecure configuration. ' +
          'Please configure proper production values for the environment variables listed above.'
      );
      process.exit(1);
    }
    throw error;
  }
}
