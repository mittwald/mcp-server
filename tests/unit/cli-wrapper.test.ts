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

// Mock child_process.execFile
vi.mock('child_process', async (importOriginal) => {
  const original = await importOriginal<typeof childProcess>();
  return {
    ...original,
    execFile: vi.fn(),
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
}));

describe('cli-wrapper', () => {
  const mockExecFile = vi.mocked(childProcess.execFile);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('executeCli', () => {
    describe('shell injection prevention', () => {
      it('uses execFile instead of exec to prevent shell injection', async () => {
        // Mock successful execution
        mockExecFile.mockImplementation(((
          command: string,
          args: string[],
          options: any,
          callback?: (error: Error | null, result: { stdout: string; stderr: string }) => void
        ) => {
          if (callback) {
            callback(null, { stdout: 'success', stderr: '' });
          }
          return {} as any;
        }) as any);

        await executeCli('mw', ['project', 'list', '--output', 'json']);

        // Verify execFile was called (not exec)
        expect(mockExecFile).toHaveBeenCalled();
        const [command, args] = mockExecFile.mock.calls[0];
        expect(command).toBe('mw');
        expect(args).toEqual(['project', 'list', '--output', 'json']);
      });

      it('passes shell metacharacters as literal arguments', async () => {
        mockExecFile.mockImplementation(((
          command: string,
          args: string[],
          options: any,
          callback?: (error: Error | null, result: { stdout: string; stderr: string }) => void
        ) => {
          if (callback) {
            callback(null, { stdout: 'success', stderr: '' });
          }
          return {} as any;
        }) as any);

        // These shell metacharacters should NOT be interpreted
        const dangerousInput = '$(rm -rf /)';
        await executeCli('mw', ['project', 'get', dangerousInput]);

        const [, args] = mockExecFile.mock.calls[0];
        // The dangerous input should be passed as-is (literal string)
        expect(args).toContain(dangerousInput);
      });

      it('does not interpret backticks as command substitution', async () => {
        mockExecFile.mockImplementation(((
          command: string,
          args: string[],
          options: any,
          callback?: (error: Error | null, result: { stdout: string; stderr: string }) => void
        ) => {
          if (callback) {
            callback(null, { stdout: 'success', stderr: '' });
          }
          return {} as any;
        }) as any);

        const backtickInput = '`whoami`';
        await executeCli('mw', ['project', 'get', backtickInput]);

        const [, args] = mockExecFile.mock.calls[0];
        expect(args).toContain(backtickInput);
      });

      it('does not interpret semicolons as command separators', async () => {
        mockExecFile.mockImplementation(((
          command: string,
          args: string[],
          options: any,
          callback?: (error: Error | null, result: { stdout: string; stderr: string }) => void
        ) => {
          if (callback) {
            callback(null, { stdout: 'success', stderr: '' });
          }
          return {} as any;
        }) as any);

        const semicolonInput = '; rm -rf /';
        await executeCli('mw', ['project', 'get', semicolonInput]);

        const [, args] = mockExecFile.mock.calls[0];
        expect(args).toContain(semicolonInput);
      });

      it('does not interpret pipe characters', async () => {
        mockExecFile.mockImplementation(((
          command: string,
          args: string[],
          options: any,
          callback?: (error: Error | null, result: { stdout: string; stderr: string }) => void
        ) => {
          if (callback) {
            callback(null, { stdout: 'success', stderr: '' });
          }
          return {} as any;
        }) as any);

        const pipeInput = '| cat /etc/passwd';
        await executeCli('mw', ['project', 'get', pipeInput]);

        const [, args] = mockExecFile.mock.calls[0];
        expect(args).toContain(pipeInput);
      });
    });

    describe('token redaction', () => {
      it('redacts token in error messages', async () => {
        const secretToken = 'mwat_super_secret_token_12345';
        const error = new Error('Command failed');
        (error as any).stderr = '';
        (error as any).code = 1;

        mockExecFile.mockImplementation(((
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

        mockExecFile.mockImplementation(((
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

        mockExecFile.mockImplementation(((
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

        mockExecFile.mockImplementation(((
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

        mockExecFile.mockImplementation(((
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
      it('uses default timeout of 30000ms', async () => {
        let capturedOptions: any = {};

        mockExecFile.mockImplementation(((
          command: string,
          args: string[],
          options: any,
          callback?: (error: Error | null, result: { stdout: string; stderr: string }) => void
        ) => {
          capturedOptions = options;
          if (callback) {
            callback(null, { stdout: 'success', stderr: '' });
          }
          return {} as any;
        }) as any);

        await executeCli('mw', ['project', 'list']);

        expect(capturedOptions.timeout).toBe(30000);
      });

      it('allows custom timeout', async () => {
        let capturedOptions: any = {};

        mockExecFile.mockImplementation(((
          command: string,
          args: string[],
          options: any,
          callback?: (error: Error | null, result: { stdout: string; stderr: string }) => void
        ) => {
          capturedOptions = options;
          if (callback) {
            callback(null, { stdout: 'success', stderr: '' });
          }
          return {} as any;
        }) as any);

        await executeCli('mw', ['project', 'list'], { timeout: 60000 });

        expect(capturedOptions.timeout).toBe(60000);
      });

      it('includes signal information in error output when killed', async () => {
        const error = new Error('Command killed');
        (error as any).stderr = '';
        (error as any).signal = 'SIGTERM';
        (error as any).code = null;

        mockExecFile.mockImplementation(((
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

        const result = await executeCli('mw', ['project', 'list']);

        expect(result.stderr).toContain('SIGTERM');
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
