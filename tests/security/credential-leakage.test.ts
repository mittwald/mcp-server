import { describe, expect, it } from 'vitest';

import { redactCredentialsFromCommand } from '../../src/utils/credential-redactor.js';
import { buildUpdatedAttributes } from '../../src/utils/credential-response.js';

describe('Credential Security Validation', () => {
  describe('Command Redaction', () => {
    it('redacts --password flags', () => {
      const cmd = 'mw user create --password secret123';
      const safe = redactCredentialsFromCommand({ command: cmd });
      expect(safe).toBe('mw user create --password [REDACTED]');
      expect(safe).not.toContain('secret123');
    });

    it('redacts --token flags', () => {
      const cmd = 'mw auth login --token abc123def456';
      const safe = redactCredentialsFromCommand({ command: cmd });
      expect(safe).toContain('[REDACTED]');
      expect(safe).not.toContain('abc123def456');
    });

    it('redacts password= query parameters', () => {
      const cmd = 'curl "https://api.example.com?password=secret"';
      const safe = redactCredentialsFromCommand({ command: cmd });
      expect(safe).toContain('password=[REDACTED]');
      expect(safe).not.toContain('secret');
    });

    it('handles multiple credentials in one command', () => {
      const cmd = 'mw user create --password pw123 --token tk456';
      const safe = redactCredentialsFromCommand({ command: cmd });
      expect(safe).not.toContain('pw123');
      expect(safe).not.toContain('tk456');
      expect(safe).toContain('[REDACTED]');
    });
  });

  describe('Response Sanitization', () => {
    it('converts password to passwordChanged flag', () => {
      const attrs = buildUpdatedAttributes({ password: 'secret', description: 'User' });
      expect(attrs.password).toBeUndefined();
      expect(attrs.passwordChanged).toBe(true);
      expect(attrs.description).toBe('User');
    });

    it('converts token to tokenChanged flag', () => {
      const attrs = buildUpdatedAttributes({ token: 'abc123', name: 'API' });
      expect(attrs.token).toBeUndefined();
      expect(attrs.tokenChanged).toBe(true);
    });

    it('preserves non-credential fields', () => {
      const attrs = buildUpdatedAttributes({
        description: 'Test',
        accessLevel: 'full',
        password: 'secret'
      });
      expect(attrs.description).toBe('Test');
      expect(attrs.accessLevel).toBe('full');
    });
  });
});
