import { describe, expect, it } from 'vitest';

import {
  DEFAULT_CREDENTIAL_PATTERNS,
  redactCredentialsFromCommand,
  redactMetadata,
  type RedactionPattern,
} from '../../../src/utils/credential-redactor.js';

describe('credential-redactor', () => {
  it('redacts default credential flags', () => {
    const command = 'mw tool --password secret123 --token abc456 --api-key xyz789 --secret hidden --access-token tok';
    const sanitized = redactCredentialsFromCommand({ command });

    expect(sanitized).not.toContain('secret123');
    expect(sanitized).not.toContain('abc456');
    expect(sanitized).not.toContain('xyz789');
    expect(sanitized).not.toContain('hidden');
    expect(sanitized).not.toMatch(/--access-token\s+tok/);
    expect(sanitized).toContain('--password [REDACTED]');
    expect(sanitized).toContain('--token [REDACTED]');
    expect(sanitized).toContain('--api-key [REDACTED]');
    expect(sanitized).toContain('--secret [REDACTED]');
    expect(sanitized).toContain('--access-token [REDACTED]');
  });

  it('redacts query parameters containing credentials', () => {
    const command = 'curl "https://example.com?password=secret&token=another"';
    const sanitized = redactCredentialsFromCommand({ command });

    expect(sanitized).not.toContain('secret');
    expect(sanitized).not.toContain('another');
    expect(sanitized).toContain('password=[REDACTED]');
    expect(sanitized).toMatch(/token=\[REDACTED/);
  });

  it('supports custom patterns', () => {
    const patterns: RedactionPattern[] = [
      { pattern: /apiKey=\w+/g, placeholder: 'apiKey=[SAFE]' },
    ];
    const command = 'curl --header "apiKey=12345"';

    const sanitized = redactCredentialsFromCommand({ command, patterns });

    expect(sanitized).toBe('curl --header "apiKey=[SAFE]"');
  });

  it('preserves credential length when requested', () => {
    const command = 'mw user create --password supersecretvalue';
    const sanitized = redactCredentialsFromCommand({ command, preserveLength: true });

    expect(sanitized).toContain('[REDACTED:16]');
    expect(sanitized).not.toContain('supersecretvalue');
  });

  it('handles multiple occurrences of same pattern', () => {
    const command = 'mw reset --token first --token second';
    const sanitized = redactCredentialsFromCommand({ command });
    const matches = sanitized.match(/\[REDACTED]/g) ?? [];

    expect(matches).toHaveLength(2);
    expect(sanitized).not.toContain('first');
    expect(sanitized).not.toContain('second');
  });

  it('returns original command when no patterns match', () => {
    const command = 'mw list users --limit 10';
    const sanitized = redactCredentialsFromCommand({ command });

    expect(sanitized).toBe(command);
  });

  it('handles empty command string gracefully', () => {
    const sanitized = redactCredentialsFromCommand({ command: '' });
    expect(sanitized).toBe('');
  });

  it('redacts credentials when nested inside metadata', () => {
    const meta = {
      command: 'mw user update --password foo',
      durationMs: 12,
    };

    const sanitized = redactMetadata(meta);

    expect(sanitized.command).toContain('[REDACTED]');
    expect(sanitized.command).not.toContain('foo');
    expect(sanitized.durationMs).toBe(12);
  });

  it('returns metadata unchanged when no command provided', () => {
    const meta = { durationMs: 10 };
    expect(redactMetadata(meta)).toBe(meta);
  });

  it('exposes default patterns for reuse', () => {
    expect(Array.isArray(DEFAULT_CREDENTIAL_PATTERNS)).toBe(true);
    expect(DEFAULT_CREDENTIAL_PATTERNS.length).toBeGreaterThan(0);
  });
});
