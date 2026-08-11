import { describe, expect, it } from 'vitest';

import { redactCredentialsFromCommand } from '../../src/utils/credential-redactor.js';
import { buildUpdatedAttributes } from '../../src/utils/credential-response.js';
import { formatToolResponse } from '../../src/utils/format-tool-response.js';
import { LibraryError, libraryErrorFromApiError } from '../../packages/mittwald-cli-core/src/contracts/functions.js';

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

  describe('API Error Sanitization', () => {
    const SECRET_TOKEN = '79d04ed5-live-mittwald-access-token';

    /**
     * Shaped like a real axios error: the sensitive data (the access token) lives on
     * `config.headers`, not on `response.data`, and is only reachable through the
     * `toJSON()` method that axios attaches to `AxiosError.prototype`. `JSON.stringify`
     * calls `toJSON()` automatically, so any code path that serializes the raw error
     * object (e.g. `{ details: { originalError: error } }`) reintroduces the leak even
     * though naive string/property inspection of the error looks safe.
     */
    function fakeAxiosError() {
      const config = {
        url: 'https://api.mittwald.de/v2/projects/abc/memberships',
        method: 'get',
        headers: {
          'x-access-token': SECRET_TOKEN,
          Accept: 'application/json',
        },
      };
      const response = {
        status: 403,
        statusText: 'Forbidden',
        data: {
          type: 'AuthorizationError',
          message: 'You are not allowed to perform this action.',
          params: { traceId: 'trace-abc-123' },
        },
      };

      return {
        isAxiosError: true,
        name: 'AxiosError',
        message: 'Request failed with status code 403',
        code: 'ERR_BAD_REQUEST',
        config,
        request: {},
        response,
        stack: 'AxiosError: Request failed with status code 403\n    at /home/agent/app/node_modules/axios/lib/core/settle.js:19:12',
        toJSON() {
          return {
            message: this.message,
            name: this.name,
            stack: this.stack,
            config,
            code: this.code,
            status: response.status,
          };
        },
      };
    }

    it('strips request config, headers and stack traces from LibraryError.details', () => {
      const error = libraryErrorFromApiError(fakeAxiosError(), performance.now());

      expect(error).toBeInstanceOf(LibraryError);
      expect(JSON.stringify(error.details)).not.toContain(SECRET_TOKEN);
      expect(error.details).not.toHaveProperty('originalError');
      expect(error.details).not.toHaveProperty('config');
      expect(error.details).not.toHaveProperty('headers');
      expect(error.details).not.toHaveProperty('stack');

      // still carries the information handlers/users actually need
      expect((error.details as Record<string, unknown>).status).toBe(403);
      expect((error.details as Record<string, unknown>).traceId).toBe('trace-abc-123');
    });

    it('never leaks the live access token through a tool error response', () => {
      const error = libraryErrorFromApiError(fakeAxiosError(), performance.now());
      const toolResult = formatToolResponse('error', error.message, {
        code: error.code,
        details: error.details,
      });

      const text = (toolResult.content[0] as { text: string }).text;
      expect(text).not.toContain(SECRET_TOKEN);
      expect(text).not.toContain('x-access-token');
      expect(text).not.toContain('/home/agent');
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
