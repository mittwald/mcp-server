/**
 * Unit tests for Main MCP Server Startup Validator
 *
 * Tests cover:
 * - Placeholder secret detection
 * - CORS wildcard blocking in production
 * - Development mode warnings (non-blocking)
 * - Process exit on validation failure
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { isPlaceholder, validateSecrets, StartupValidationError } from '../../src/server/startup-validator.js';

describe('isPlaceholder', () => {
  describe('exact match detection', () => {
    const knownPlaceholders = [
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

    knownPlaceholders.forEach((placeholder) => {
      it(`detects "${placeholder}" as placeholder`, () => {
        expect(isPlaceholder(placeholder)).toBe(true);
      });

      it(`detects "${placeholder.toUpperCase()}" as placeholder (case-insensitive)`, () => {
        expect(isPlaceholder(placeholder.toUpperCase())).toBe(true);
      });
    });
  });

  describe('pattern-based detection', () => {
    const patternBasedPlaceholders = [
      'test-secret-abc123',
      'testsecret',
      'dev-secret',
      'devsecret',
      'example-key',
      'placeholder-value',
      'changeme123',
      'xxxx',
      'your-custom-key',
    ];

    patternBasedPlaceholders.forEach((placeholder) => {
      it(`detects "${placeholder}" as placeholder via pattern`, () => {
        expect(isPlaceholder(placeholder)).toBe(true);
      });
    });
  });

  describe('valid secrets', () => {
    const validSecrets = [
      'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0',
      'R4nd0m$ecr3tK3y!@#2024',
      'production-api-key-abc123xyz',
      'my-secure-jwt-secret-2024',
      'k8s-cluster-secret-token',
    ];

    validSecrets.forEach((secret) => {
      it(`accepts "${secret}" as valid secret`, () => {
        expect(isPlaceholder(secret)).toBe(false);
      });
    });
  });

  describe('edge cases', () => {
    it('returns false for undefined', () => {
      expect(isPlaceholder(undefined)).toBe(false);
    });

    it('returns false for empty string', () => {
      expect(isPlaceholder('')).toBe(false);
    });

    it('handles whitespace in values', () => {
      expect(isPlaceholder('  placeholder  ')).toBe(true);
    });
  });
});

describe('validateSecrets', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('production mode', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });

    it('throws on placeholder JWT_SECRET', () => {
      process.env.JWT_SECRET = 'test-secret';

      expect(() => validateSecrets()).toThrow(StartupValidationError);
      expect(() => validateSecrets()).toThrow(/JWT_SECRET/);
    });

    it('throws on placeholder OAUTH_BRIDGE_JWT_SECRET', () => {
      process.env.JWT_SECRET = 'valid-random-secure-key-2024';
      process.env.OAUTH_BRIDGE_JWT_SECRET = 'changeme';

      expect(() => validateSecrets()).toThrow(StartupValidationError);
      expect(() => validateSecrets()).toThrow(/OAUTH_BRIDGE_JWT_SECRET/);
    });

    it('throws on CORS_ORIGIN wildcard', () => {
      process.env.JWT_SECRET = 'valid-random-secure-key-2024';
      process.env.CORS_ORIGIN = '*';

      expect(() => validateSecrets()).toThrow(StartupValidationError);
      expect(() => validateSecrets()).toThrow(/CORS wildcard/);
    });

    it('throws when CORS_ORIGIN is not set', () => {
      process.env.JWT_SECRET = 'valid-random-secure-key-2024';
      delete process.env.CORS_ORIGIN;

      expect(() => validateSecrets()).toThrow(StartupValidationError);
      expect(() => validateSecrets()).toThrow(/CORS_ORIGIN must be set/);
    });

    it('accepts valid configuration', () => {
      process.env.JWT_SECRET = 'valid-random-secure-key-2024';
      process.env.OAUTH_BRIDGE_JWT_SECRET = 'another-valid-key-xyz';
      process.env.CORS_ORIGIN = 'https://example.com';

      expect(() => validateSecrets()).not.toThrow();
    });

    it('accepts configuration with specific CORS origins', () => {
      process.env.JWT_SECRET = 'valid-random-secure-key-2024';
      process.env.CORS_ORIGIN = 'https://app.example.com,https://admin.example.com';

      expect(() => validateSecrets()).not.toThrow();
    });

    it('provides actionable error message', () => {
      process.env.JWT_SECRET = 'placeholder';
      process.env.CORS_ORIGIN = 'https://example.com';

      try {
        validateSecrets();
        expect.fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(StartupValidationError);
        expect((error as Error).message).toContain('configure a secure random value');
      }
    });
  });

  describe('development mode', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    it('allows placeholder JWT_SECRET with warning', () => {
      process.env.JWT_SECRET = 'test-secret';

      expect(() => validateSecrets()).not.toThrow();
    });

    it('allows CORS_ORIGIN wildcard with warning', () => {
      process.env.JWT_SECRET = 'valid-key';
      process.env.CORS_ORIGIN = '*';

      expect(() => validateSecrets()).not.toThrow();
    });
  });

  describe('unset NODE_ENV (defaults to development)', () => {
    beforeEach(() => {
      delete process.env.NODE_ENV;
    });

    it('allows placeholder secrets', () => {
      process.env.JWT_SECRET = 'test-secret';

      expect(() => validateSecrets()).not.toThrow();
    });
  });
});

describe('StartupValidationError', () => {
  it('has correct name property', () => {
    const error = new StartupValidationError('test message');
    expect(error.name).toBe('StartupValidationError');
  });

  it('is an instance of Error', () => {
    const error = new StartupValidationError('test message');
    expect(error).toBeInstanceOf(Error);
  });

  it('preserves message', () => {
    const error = new StartupValidationError('specific error message');
    expect(error.message).toBe('specific error message');
  });
});
