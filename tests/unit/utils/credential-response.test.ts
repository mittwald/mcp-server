import { describe, expect, it } from 'vitest';

import { buildSecureToolResponse, buildUpdatedAttributes } from '../../../src/utils/credential-response.js';

function parse(result: ReturnType<typeof buildSecureToolResponse>) {
  const text = result.content[0]?.text ?? '{}';
  return JSON.parse(text);
}

describe('credential-response', () => {
  describe('buildUpdatedAttributes', () => {
    it('converts password and token fields to boolean flags', () => {
      const attrs = buildUpdatedAttributes({
        password: 'secret',
        token: 'abc123',
        description: 'User',
      });

      expect(attrs.password).toBeUndefined();
      expect(attrs.token).toBeUndefined();
      expect(attrs.passwordChanged).toBe(true);
      expect(attrs.tokenChanged).toBe(true);
      expect(attrs.description).toBe('User');
    });

    it('handles apiKey and secret fields', () => {
      const attrs = buildUpdatedAttributes({
        apiKey: 'key',
        secret: '',
        name: 'API client',
      });

      expect(attrs.apiKey).toBeUndefined();
      expect(attrs.secret).toBeUndefined();
      expect(attrs.apiKeyChanged).toBe(true);
      expect(attrs.secretChanged).toBe(false);
      expect(attrs.name).toBe('API client');
    });

    it('passes through other fields unchanged', () => {
      const attrs = buildUpdatedAttributes({ enabled: false, count: 3 });
      expect(attrs).toEqual({ enabled: false, count: 3 });
    });
  });

  describe('buildSecureToolResponse', () => {
    it('redacts credential fields and metadata in response payload', () => {
      const response = buildSecureToolResponse(
        'success',
        'Updated resource.',
        {
          userId: 'mysql-user-1',
          password: 'temporary',
          token: 'abc123',
        },
        {
          command: 'mw database mysql user update mysql-user-1 --password temporary',
          durationMs: 42,
        },
      );

      const payload = parse(response);

      expect(payload.status).toBe('success');
      expect(payload.message).toBe('Updated resource.');
      expect(payload.data.password).toBeUndefined();
      expect(payload.data.token).toBeUndefined();
      expect(payload.data.passwordChanged).toBe(true);
      expect(payload.data.tokenChanged).toBe(true);
      expect(payload.data.userId).toBe('mysql-user-1');
      expect(payload.meta.command).not.toContain('temporary');
      expect(payload.meta.command).toContain('[REDACTED]');
      expect(payload.meta.durationMs).toBe(42);
    });

    it('works without data or metadata', () => {
      const response = buildSecureToolResponse('error', 'Failure.');
      const payload = parse(response);

      expect(payload.status).toBe('error');
      expect(payload.message).toBe('Failure.');
      expect(payload.data).toBeUndefined();
      expect(payload.meta).toBeUndefined();
    });
  });
});
