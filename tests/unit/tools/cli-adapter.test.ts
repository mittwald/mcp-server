import { beforeEach, afterAll, describe, expect, it, vi } from 'vitest';

import { invokeCliTool } from '../../../src/tools/cli-adapter.js';
import type { CliExecuteResult } from '../../../src/utils/cli-wrapper.js';

vi.mock('../../../src/utils/logger.js', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

const mocks = vi.hoisted(() => {
  class SessionAuthError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'SessionAuthenticationError';
    }
  }

  class SessionMissingError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'SessionNotFoundError';
    }
  }

  return {
    executeWithSession: vi.fn(),
    SessionAuthenticationError: SessionAuthError,
    SessionNotFoundError: SessionMissingError,
    getCurrentSessionId: vi.fn(() => undefined),
  };
});

vi.mock('../../../src/utils/session-aware-cli.js', () => ({
  sessionAwareCli: {
    executeWithSession: mocks.executeWithSession,
  },
  SessionAuthenticationError: mocks.SessionAuthenticationError,
  SessionNotFoundError: mocks.SessionNotFoundError,
}));

vi.mock('../../../src/utils/execution-context.js', () => ({
  getCurrentSessionId: mocks.getCurrentSessionId,
}));

const { executeWithSession, SessionAuthenticationError: MockSessionAuthenticationError, SessionNotFoundError: MockSessionNotFoundError, getCurrentSessionId } = mocks;

const buildExecutionResult = (overrides: Partial<CliExecuteResult> = {}): CliExecuteResult => ({
  stdout: '',
  stderr: '',
  exitCode: 0,
  durationMs: 5,
  ...overrides,
});

const ORIGINAL_ENV = {
  MCP_TOOL_MAX_PAYLOAD_MB: process.env.MCP_TOOL_MAX_PAYLOAD_MB,
  MCP_CLI_MAX_BUFFER_MB: process.env.MCP_CLI_MAX_BUFFER_MB,
};

describe('invokeCliTool', () => {
  beforeEach(() => {
    executeWithSession.mockReset();
    getCurrentSessionId.mockReset();
    getCurrentSessionId.mockReturnValue(undefined);
    process.env.MCP_TOOL_MAX_PAYLOAD_MB = undefined;
    process.env.MCP_CLI_MAX_BUFFER_MB = undefined;
  });

  it('returns parsed result when CLI succeeds', async () => {
    executeWithSession.mockResolvedValue(
      buildExecutionResult({ stdout: '["p-123"]' })
    );

    const result = await invokeCliTool<string[]>({
      toolName: 'mittwald_project_list',
      argv: ['project', 'list'],
      sessionId: 'session-123',
      parser: (stdout) => JSON.parse(stdout),
    });

    expect(result.ok).toBe(true);
    expect(result.result).toEqual(['p-123']);
    expect(result.meta.exitCode).toBe(0);
    expect(executeWithSession).toHaveBeenCalledWith('mw', ['project', 'list'], 'session-123', {}, 'mittwald_project_list');
  });

  it('uses session from execution context when not provided explicitly', async () => {
    executeWithSession.mockResolvedValue(buildExecutionResult({ stdout: 'ok' }));
    getCurrentSessionId.mockReturnValue('session-from-context');

    const result = await invokeCliTool({
      toolName: 'mittwald_project_list',
      argv: ['project', 'list'],
    });

    expect(result.ok).toBe(true);
    expect(executeWithSession).toHaveBeenCalledWith('mw', ['project', 'list'], 'session-from-context', {}, 'mittwald_project_list');
  });

  it('throws CliToolError when session is missing', async () => {
    await expect(
      invokeCliTool({ toolName: 'mittwald_project_list', argv: ['project', 'list'] })
    ).rejects.toMatchObject({ kind: 'SESSION_MISSING' });
  });

  it('throws authentication error when CLI returns non-zero exit code with auth hint', async () => {
    executeWithSession.mockResolvedValue(
      buildExecutionResult({ exitCode: 1, stderr: 'unauthorized: token expired' })
    );

    await expect(
      invokeCliTool({ toolName: 'mittwald_project_list', argv: ['project', 'list'], sessionId: 'session-1' })
    ).rejects.toMatchObject({ kind: 'AUTHENTICATION' });
  });

  it('wraps parser exceptions as parsing errors', async () => {
    executeWithSession.mockResolvedValue(buildExecutionResult({ stdout: 'not-json' }));

    await expect(
      invokeCliTool({
        toolName: 'mittwald_project_list',
        argv: ['project', 'list'],
        sessionId: 'session-1',
        parser: () => {
          throw new Error('boom');
        },
      })
    ).rejects.toMatchObject({ kind: 'PARSING' });
  });

  it('maps session authentication errors', async () => {
    executeWithSession.mockRejectedValue(new MockSessionAuthenticationError('auth failed'));

    await expect(
      invokeCliTool({ toolName: 'mittwald_project_list', argv: ['project', 'list'], sessionId: 'session-1' })
    ).rejects.toMatchObject({ kind: 'AUTHENTICATION' });
  });

  it('maps session not found errors', async () => {
    executeWithSession.mockRejectedValue(new MockSessionNotFoundError('missing'));

    await expect(
      invokeCliTool({ toolName: 'mittwald_project_list', argv: ['project', 'list'], sessionId: 'session-1' })
    ).rejects.toMatchObject({ kind: 'SESSION_MISSING' });
  });

  it('supports overriding binary and cli options', async () => {
    executeWithSession.mockResolvedValue(buildExecutionResult({ stdout: 'ok' }));

    await invokeCliTool({
      toolName: 'mittwald_project_list',
      argv: ['project', 'list'],
      sessionId: 'session-1',
      binary: 'npx mw',
      cliOptions: { timeout: 10_000 },
    });

    expect(executeWithSession).toHaveBeenCalledWith('npx mw', ['project', 'list'], 'session-1', { timeout: 10_000 }, 'mittwald_project_list');
  });

  it('fails with OUTPUT_LIMIT when stdout exceeds configured cap', async () => {
    process.env.MCP_TOOL_MAX_PAYLOAD_MB = '1';
    executeWithSession.mockResolvedValue(
      buildExecutionResult({ stdout: 'x'.repeat(2 * 1024 * 1024) })
    );

    await expect(
      invokeCliTool({
        toolName: 'mittwald_project_list',
        argv: ['project', 'list'],
        sessionId: 'session-1',
      })
    ).rejects.toMatchObject({
      kind: 'OUTPUT_LIMIT',
    });
  });
});

afterAll(() => {
  process.env.MCP_TOOL_MAX_PAYLOAD_MB = ORIGINAL_ENV.MCP_TOOL_MAX_PAYLOAD_MB;
  process.env.MCP_CLI_MAX_BUFFER_MB = ORIGINAL_ENV.MCP_CLI_MAX_BUFFER_MB;
});
