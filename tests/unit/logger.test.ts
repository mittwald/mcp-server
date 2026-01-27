import { describe, it, expect } from 'vitest';
import { logger, sanitizeValue } from '../../src/utils/structured-logger.js';

describe('Structured Logger', () => {
  it('should sanitize OAuth tokens from arguments', () => {
    const input = {
      projectId: 'p-123',
      access_token: 'secret_token_abc123',
    };

    const sanitized = sanitizeValue(input) as { projectId: string; access_token: string };

    expect(JSON.stringify(sanitized)).not.toContain('secret_token_abc123');
    expect(sanitized).toMatchObject({
      projectId: 'p-123',
      access_token: expect.stringMatching(/\[REDACTED/),
    });
  });

  it('should log with required MCP tool call fields', () => {
    // Smoke test: logger is callable
    expect(() => {
      logger.info({
        event: 'tool_call_success',
        toolName: 'mittwald_app_list',
        sessionId: 'test-session',
      }, 'Test log');
    }).not.toThrow();
  });
});
