/**
 * Unit tests for startup-validator
 *
 * Tests cover:
 * - Placeholder detection for known values
 * - Pattern matching for placeholder naming conventions
 * - Production mode blocking behavior
 * - Development mode warning behavior
 * - CORS wildcard validation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { validateSecrets, isPlaceholder, StartupValidationError } from '../../src/startup-validator.js';

describe('startup-validator', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Reset to a clean environment for each test
    process.env = { ...originalEnv };
    // Clear any security-related env vars
    delete process.env.BRIDGE_JWT_SECRET;
    delete process.env.JWT_SECRET;
    delete process.env.OAUTH_BRIDGE_JWT_SECRET;
    delete process.env.CORS_ORIGIN;
    delete process.env.NODE_ENV;
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe('isPlaceholder', () => {
    describe('returns true for known placeholder values', () => {
      const placeholders = [
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

      for (const placeholder of placeholders) {
        it(`detects "${placeholder}" as placeholder`, () => {
          expect(isPlaceholder(placeholder)).toBe(true);
        });

        it(`detects "${placeholder.toUpperCase()}" (uppercase) as placeholder`, () => {
          expect(isPlaceholder(placeholder.toUpperCase())).toBe(true);
        });
      }
    });

    describe('returns true for pattern-matched placeholders', () => {
      const patternMatches = [
        'test-secret-123',
        'dev-secret-key',
        'example-api-key',
        'placeholder-value',
        'changeme123',
        'xxx',
        'xxxxx',
        'your-api-key',
        'your_secret_key',
      ];

      for (const value of patternMatches) {
        it(`detects "${value}" as placeholder via pattern`, () => {
          expect(isPlaceholder(value)).toBe(true);
        });
      }
    });

    describe('returns false for secure values', () => {
      const secureValues = [
        'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
        '7f3c8a2e-1d4b-5f6g-9h0i-j1k2l3m4n5o6',
        'kLmNoPqRsTuVwXyZ0123456789AbCdEf',
        'secure-random-production-key-2024',
        'my-company-oauth-bridge-production',
        'GH7kL9mN2pQr5tUvWxYz',
        // Edge cases that should NOT be flagged
        'production-secret-key', // Contains 'secret' but not at placeholder position
        'my-test-app-production', // Contains 'test' but valid pattern
      ];

      for (const value of secureValues) {
        it(`does not flag "${value}" as placeholder`, () => {
          expect(isPlaceholder(value)).toBe(false);
        });
      }
    });

    describe('handles edge cases', () => {
      it('returns false for undefined', () => {
        expect(isPlaceholder(undefined)).toBe(false);
      });

      it('returns false for empty string', () => {
        expect(isPlaceholder('')).toBe(false);
      });

      it('handles whitespace-padded values', () => {
        expect(isPlaceholder('  placeholder  ')).toBe(true);
      });
    });
  });

  describe('validateSecrets', () => {
    describe('in production mode', () => {
      beforeEach(() => {
        process.env.NODE_ENV = 'production';
      });

      it('throws StartupValidationError for placeholder BRIDGE_JWT_SECRET', () => {
        process.env.BRIDGE_JWT_SECRET = 'development-jwt-secret-key-for-testing';

        expect(() => validateSecrets()).toThrow(StartupValidationError);
        expect(() => validateSecrets()).toThrow(/Placeholder secret detected for BRIDGE_JWT_SECRET/);
      });

      it('throws StartupValidationError for placeholder JWT_SECRET', () => {
        process.env.JWT_SECRET = 'super-secret';

        expect(() => validateSecrets()).toThrow(StartupValidationError);
        expect(() => validateSecrets()).toThrow(/Placeholder secret detected for JWT_SECRET/);
      });

      it('throws StartupValidationError for CORS_ORIGIN wildcard', () => {
        // Secure secrets but wildcard CORS
        process.env.BRIDGE_JWT_SECRET = 'secure-random-value-32-characters!';
        process.env.CORS_ORIGIN = '*';

        expect(() => validateSecrets()).toThrow(StartupValidationError);
        expect(() => validateSecrets()).toThrow(/CORS wildcard.*not allowed in production/);
      });

      it('does not throw for secure configuration', () => {
        process.env.BRIDGE_JWT_SECRET = 'secure-random-value-32-characters!';
        process.env.CORS_ORIGIN = 'https://example.com';

        expect(() => validateSecrets()).not.toThrow();
      });

      it('does not throw when CORS_ORIGIN is not set', () => {
        process.env.BRIDGE_JWT_SECRET = 'secure-random-value-32-characters!';
        delete process.env.CORS_ORIGIN;

        expect(() => validateSecrets()).not.toThrow();
      });

      it('does not throw for specific CORS origins', () => {
        process.env.BRIDGE_JWT_SECRET = 'secure-random-value-32-characters!';
        process.env.CORS_ORIGIN = 'https://app.example.com,https://api.example.com';

        expect(() => validateSecrets()).not.toThrow();
      });
    });

    describe('in development mode', () => {
      beforeEach(() => {
        process.env.NODE_ENV = 'development';
      });

      it('does not throw for placeholder secrets', () => {
        process.env.BRIDGE_JWT_SECRET = 'development-jwt-secret-key-for-testing';

        expect(() => validateSecrets()).not.toThrow();
      });

      it('does not throw for CORS_ORIGIN wildcard', () => {
        process.env.BRIDGE_JWT_SECRET = 'secure-value';
        process.env.CORS_ORIGIN = '*';

        expect(() => validateSecrets()).not.toThrow();
      });

      it('does not throw when NODE_ENV is not set', () => {
        delete process.env.NODE_ENV;
        process.env.BRIDGE_JWT_SECRET = 'development-jwt-secret-key-for-testing';

        expect(() => validateSecrets()).not.toThrow();
      });
    });

    describe('error messages', () => {
      beforeEach(() => {
        process.env.NODE_ENV = 'production';
      });

      it('provides actionable error message for placeholder secret', () => {
        process.env.BRIDGE_JWT_SECRET = 'placeholder';

        try {
          validateSecrets();
          expect.fail('Should have thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(StartupValidationError);
          expect((error as Error).message).toContain('BRIDGE_JWT_SECRET');
          expect((error as Error).message).toContain('configure a secure random value');
        }
      });

      it('provides actionable error message for CORS wildcard', () => {
        process.env.BRIDGE_JWT_SECRET = 'secure-value';
        process.env.CORS_ORIGIN = '*';

        try {
          validateSecrets();
          expect.fail('Should have thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(StartupValidationError);
          expect((error as Error).message).toContain('CORS_ORIGIN');
          expect((error as Error).message).toContain('specific origin');
        }
      });
    });
  });

  describe('StartupValidationError', () => {
    it('has correct name property', () => {
      const error = new StartupValidationError('test message');
      expect(error.name).toBe('StartupValidationError');
    });

    it('is instance of Error', () => {
      const error = new StartupValidationError('test message');
      expect(error).toBeInstanceOf(Error);
    });

    it('preserves message', () => {
      const error = new StartupValidationError('custom error message');
      expect(error.message).toBe('custom error message');
    });
  });
});
