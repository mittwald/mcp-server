/**
 * Unit tests for cli-wrapper
 *
 * Tests cover:
 * - Shell injection prevention via execFile (not exec)
 * - Token redaction in error messages
 * - Environment variable handling
 * - Timeout and buffer limit handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { executeCli, parseJsonOutput, parseQuietOutput } from '../../src/utils/cli-wrapper.js';
import * as childProcess from 'child_process';
import { promisify } from 'util';
import { EventEmitter } from 'events';
import { Readable } from 'stream';

// Helper to create mock spawn child process
function createMockChild(stdout: string, stderr: string, exitCode: number = 0) {
  const child = new EventEmitter() as any;
  child.stdout = new EventEmitter();
  child.stderr = new EventEmitter();
  child.stdin = null;
  child.kill = vi.fn();
  child.killed = false;

  // Simulate async process execution
  setImmediate(() => {
    if (stdout) child.stdout.emit('data', Buffer.from(stdout));
    if (stderr) child.stderr.emit('data', Buffer.from(stderr));
    child.emit('close', exitCode, null);
  });

  return child;
}

// Mock child_process.spawn
vi.mock('child_process', async (importOriginal) => {
  const original = await importOriginal<typeof childProcess>();
  return {
    ...original,
    spawn: vi.fn(),
  };
});

// Mock session manager to avoid import issues
vi.mock('../../src/server/session-manager.js', () => ({
  sessionManager: {
    getSession: vi.fn().mockResolvedValue(null),
  },
}));

// Mock execution context
vi.mock('../../src/utils/execution-context.js', () => ({
  getCurrentSessionId: vi.fn().mockReturnValue(null),
  getCurrentAbortSignal: vi.fn().mockReturnValue(undefined),
}));

describe('cli-wrapper', () => {
  const mockSpawn = vi.mocked(childProcess.spawn);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('executeCli', () => {
    describe('shell injection prevention', () => {
      it('uses spawn instead of shell to prevent shell injection', async () => {
        // Mock successful execution
        mockSpawn.mockReturnValue(createMockChild('success', '', 0));

        await executeCli('mw', ['project', 'list', '--output', 'json']);

        // Verify spawn was called (not shell)
        expect(mockSpawn).toHaveBeenCalled();
        const [command, args] = mockSpawn.mock.calls[0];
        expect(command).toBe('mw');
        expect(args).toEqual(['project', 'list', '--output', 'json']);
      });

      it('passes shell metacharacters as literal arguments', async () => {
        mockSpawn.mockReturnValue(createMockChild('success', '', 0));

        // These shell metacharacters should NOT be interpreted
        const dangerousInput = '$(rm -rf /)';
        await executeCli('mw', ['project', 'get', dangerousInput]);

        const [, args] = mockSpawn.mock.calls[0];
        // The dangerous input should be passed as-is (literal string)
        expect(args).toContain(dangerousInput);
      });

      it('does not interpret backticks as command substitution', async () => {
        mockSpawn.mockReturnValue(createMockChild('success', '', 0));

        const backtickInput = '`whoami`';
        await executeCli('mw', ['project', 'get', backtickInput]);

        const [, args] = mockSpawn.mock.calls[0];
        expect(args).toContain(backtickInput);
      });

      it('does not interpret semicolons as command separators', async () => {
        mockSpawn.mockReturnValue(createMockChild('success', '', 0));

        const semicolonInput = '; rm -rf /';
        await executeCli('mw', ['project', 'get', semicolonInput]);

        const [, args] = mockSpawn.mock.calls[0];
        expect(args).toContain(semicolonInput);
      });

      it('does not interpret pipe characters', async () => {
        mockSpawn.mockReturnValue(createMockChild('success', '', 0));

        const pipeInput = '| cat /etc/passwd';
        await executeCli('mw', ['project', 'get', pipeInput]);

        const [, args] = mockSpawn.mock.calls[0];
        expect(args).toContain(pipeInput);
      });
    });

    describe('token redaction', () => {
      it('redacts token in error messages', async () => {
        const secretToken = 'mwat_super_secret_token_12345';
        const error = new Error('Command failed');
        (error as any).stderr = '';
        (error as any).code = 1;

        mockSpawn.mockImplementation(((
          command: string,
          args: string[],
          options: any,
          callback?: (error: Error | null, result: { stdout: string; stderr: string }) => void
        ) => {
          if (callback) {
            callback(error, { stdout: '', stderr: '' });
          }
          return {} as any;
        }) as any);

        const result = await executeCli('mw', ['project', 'list'], { token: secretToken });

        // Token should be redacted in stderr
        expect(result.stderr).not.toContain(secretToken);
        expect(result.stderr).toContain('[REDACTED]');
      });

      it('preserves other arguments in error messages', async () => {
        const error = new Error('Command failed');
        (error as any).stderr = '';
        (error as any).code = 1;

        mockSpawn.mockImplementation(((
          command: string,
          args: string[],
          options: any,
          callback?: (error: Error | null, result: { stdout: string; stderr: string }) => void
        ) => {
          if (callback) {
            callback(error, { stdout: '', stderr: '' });
          }
          return {} as any;
        }) as any);

        const result = await executeCli('mw', ['project', 'list', '--output', 'json'], { token: 'secret' });

        expect(result.stderr).toContain('project');
        expect(result.stderr).toContain('list');
        expect(result.stderr).toContain('--output');
        expect(result.stderr).toContain('json');
      });
    });

    describe('environment handling', () => {
      it('sets MITTWALD_NONINTERACTIVE=1', async () => {
        let capturedEnv: NodeJS.ProcessEnv = {};

        mockSpawn.mockImplementation(((
          command: string,
          args: string[],
          options: any,
          callback?: (error: Error | null, result: { stdout: string; stderr: string }) => void
        ) => {
          capturedEnv = options.env;
          if (callback) {
            callback(null, { stdout: 'success', stderr: '' });
          }
          return {} as any;
        }) as any);

        await executeCli('mw', ['project', 'list']);

        expect(capturedEnv.MITTWALD_NONINTERACTIVE).toBe('1');
      });

      it('sets CI=1', async () => {
        let capturedEnv: NodeJS.ProcessEnv = {};

        mockSpawn.mockImplementation(((
          command: string,
          args: string[],
          options: any,
          callback?: (error: Error | null, result: { stdout: string; stderr: string }) => void
        ) => {
          capturedEnv = options.env;
          if (callback) {
            callback(null, { stdout: 'success', stderr: '' });
          }
          return {} as any;
        }) as any);

        await executeCli('mw', ['project', 'list']);

        expect(capturedEnv.CI).toBe('1');
      });

      it('merges custom env with process env', async () => {
        let capturedEnv: NodeJS.ProcessEnv = {};

        mockSpawn.mockImplementation(((
          command: string,
          args: string[],
          options: any,
          callback?: (error: Error | null, result: { stdout: string; stderr: string }) => void
        ) => {
          capturedEnv = options.env;
          if (callback) {
            callback(null, { stdout: 'success', stderr: '' });
          }
          return {} as any;
        }) as any);

        await executeCli('mw', ['project', 'list'], { env: { CUSTOM_VAR: 'value' } });

        expect(capturedEnv.CUSTOM_VAR).toBe('value');
      });
    });

    describe('timeout handling', () => {
      it('includes signal information in error output when killed', async () => {
        const child = new EventEmitter() as any;
        child.stdout = new EventEmitter();
        child.stderr = new EventEmitter();
        child.stdin = null;
        child.kill = vi.fn();
        child.killed = false;

        mockSpawn.mockReturnValue(child);

        // Simulate process being killed with a signal
        setImmediate(() => {
          // Process was killed, close with non-zero code and SIGTERM signal
          child.emit('close', 1, 'SIGTERM');
        });

        const result = await executeCli('mw', ['project', 'list']);

        expect(result.stderr).toContain('SIGTERM');
        expect(result.exitCode).toBe(1);
      });
    });
  });

  describe('parseJsonOutput', () => {
    it('parses simple JSON object', () => {
      const result = parseJsonOutput('{"id": "123", "name": "test"}');
      expect(result).toEqual({ id: '123', name: 'test' });
    });

    it('parses JSON array', () => {
      const result = parseJsonOutput('[{"id": "1"}, {"id": "2"}]');
      expect(result).toEqual([{ id: '1' }, { id: '2' }]);
    });

    it('extracts JSON from output with prefix text', () => {
      const output = 'Some warning message\n{"id": "123"}';
      const result = parseJsonOutput(output);
      expect(result).toEqual({ id: '123' });
    });

    it('handles multiline JSON', () => {
      const output = `{
        "id": "123",
        "name": "test"
      }`;
      const result = parseJsonOutput(output);
      expect(result).toEqual({ id: '123', name: 'test' });
    });

    it('throws on invalid JSON', () => {
      expect(() => parseJsonOutput('not json')).toThrow('Failed to parse JSON output');
    });
  });

  describe('parseQuietOutput', () => {
    it('returns last non-empty line', () => {
      const output = 'Creating resource...\nResource created\n12345';
      const result = parseQuietOutput(output);
      expect(result).toBe('12345');
    });

    it('trims whitespace', () => {
      const result = parseQuietOutput('  uuid-value  \n');
      expect(result).toBe('uuid-value');
    });

    it('returns null for empty output', () => {
      const result = parseQuietOutput('');
      expect(result).toBeNull();
    });

    it('handles single line', () => {
      const result = parseQuietOutput('abc123');
      expect(result).toBe('abc123');
    });
  });
});
