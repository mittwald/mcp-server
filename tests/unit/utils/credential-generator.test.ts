import { describe, expect, it } from 'vitest';
import { performance } from 'node:perf_hooks';

import { generateSecurePassword, generateSecureToken } from '../../../src/utils/credential-generator.js';

function isBase64url(value: string): boolean {
  return /^[A-Za-z0-9_-]+$/.test(value);
}

function isBase64(value: string): boolean {
  return /^[A-Za-z0-9+/=]+$/.test(value);
}

function isHex(value: string): boolean {
  return /^[a-f0-9]+$/i.test(value);
}

describe('credential-generator', () => {
  it('enforces minimum length of 12 characters', () => {
    const credential = generateSecurePassword({ length: 8 });

    expect(credential.length).toBeGreaterThanOrEqual(12);
    expect(credential.value).toHaveLength(credential.length);
    expect(credential.generated).toBe(true);
  });

  it('supports base64url encoding by default', () => {
    const credential = generateSecurePassword();

    expect(isBase64url(credential.value)).toBe(true);
    expect(credential.encoding).toBe('base64url');
  });

  it('supports base64 and hex encodings', () => {
    const base64 = generateSecurePassword({ encoding: 'base64', length: 16 });
    const hex = generateSecurePassword({ encoding: 'hex', length: 32 });

    expect(isBase64(base64.value)).toBe(true);
    expect(base64.encoding).toBe('base64');

    expect(isHex(hex.value)).toBe(true);
    expect(hex.encoding).toBe('hex');
  });

  it('generates unique passwords across 1000 iterations', () => {
    const unique = new Set<string>();

    for (let i = 0; i < 1000; i += 1) {
      unique.add(generateSecurePassword().value);
    }

    expect(unique.size).toBe(1000);
  });

  it('generates 100 passwords within 100ms', () => {
    const start = performance.now();

    for (let i = 0; i < 100; i += 1) {
      generateSecurePassword();
    }

    const duration = performance.now() - start;
    expect(duration).toBeLessThan(100);
  });

  it('generates secure tokens using hex encoding by default', () => {
    const token = generateSecureToken();

    expect(token.encoding).toBe('hex');
    expect(token.length).toBe(64);
    expect(isHex(token.value)).toBe(true);
  });
});
