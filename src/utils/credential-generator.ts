import { randomBytes } from 'node:crypto';

export interface GeneratePasswordOptions {
  length?: number;
  minLength?: number;
  encoding?: 'base64url' | 'hex' | 'base64';
  excludeAmbiguous?: boolean;
}

export interface GeneratedCredential {
  value: string;
  generated: boolean;
  length: number;
  encoding: string;
}

function stripAmbiguousCharacters(input: string): string {
  return input.replace(/[O0I1l]/g, '');
}

function applyAmbiguousFilter(value: string, excludeAmbiguous?: boolean): string {
  if (!excludeAmbiguous) {
    return value;
  }

  const cleaned = stripAmbiguousCharacters(value);
  return cleaned.length > 0 ? cleaned : value;
}

export function generateSecurePassword(options: GeneratePasswordOptions = {}): GeneratedCredential {
  const {
    length = 24,
    minLength = 12,
    encoding = 'base64url',
    excludeAmbiguous = false,
  } = options;

  const targetLength = Math.max(minLength, length);
  let password = '';

  while (password.length < targetLength) {
    const chunk = randomBytes(targetLength).toString(encoding);
    password += applyAmbiguousFilter(chunk, excludeAmbiguous);
  }

  const value = password.slice(0, targetLength);

  return {
    value,
    generated: true,
    length: targetLength,
    encoding,
  };
}

export function generateSecureToken(length: number = 64): GeneratedCredential {
  return generateSecurePassword({ length, encoding: 'hex' });
}
