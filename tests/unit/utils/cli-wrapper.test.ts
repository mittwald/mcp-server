import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest';
import { execFileMock, resetExecMock } from '../../helpers/child-process-exec-mock.ts';

vi.mock('../../../src/server/session-manager.js', () => ({
  sessionManager: {
    getSession: vi.fn(),
  },
}));

vi.mock('../../../src/utils/execution-context.js', () => ({
  getCurrentSessionId: vi.fn(),
}));

const { sessionManager } = await import('../../../src/server/session-manager.js');
const { getCurrentSessionId } = await import('../../../src/utils/execution-context.js');
const { executeCli } = await import('../../../src/utils/cli-wrapper.js');

const mockSession = {
  sessionId: 'session-123',
  userId: 'user-1',
  mittwaldAccessToken: 'mock-access-token',
  mittwaldRefreshToken: 'mock-refresh-token',
  oauthToken: 'jwt-token',
  expiresAt: new Date(Date.now() + 60_000),
  currentContext: {},
  accessibleProjects: [],
  lastAccessed: new Date(),
  scopes: ['profile'],
};

const ORIGINAL_ENV = {
  NODE_OPTIONS: process.env.NODE_OPTIONS,
  MCP_CLI_MAX_HEAP_MB: process.env.MCP_CLI_MAX_HEAP_MB,
  MCP_CLI_MAX_BUFFER_MB: process.env.MCP_CLI_MAX_BUFFER_MB,
  MCP_CLI_NODE_OPTIONS: process.env.MCP_CLI_NODE_OPTIONS,
};

describe('executeCli', () => {
  beforeEach(() => {
    resetExecMock();
    (sessionManager.getSession as any).mockReset();
    (getCurrentSessionId as any).mockReset();
    process.env.NODE_OPTIONS = undefined;
    process.env.MCP_CLI_MAX_HEAP_MB = undefined;
    process.env.MCP_CLI_MAX_BUFFER_MB = undefined;
    process.env.MCP_CLI_NODE_OPTIONS = undefined;
  });

  it('injects session token when no token flag present', async () => {
    (getCurrentSessionId as any).mockReturnValue('session-123');
    (sessionManager.getSession as any).mockResolvedValue(mockSession);

    execFileMock.mockImplementation((file: string, args: string[], options: any, callback: any) => {
      // execFile receives args as array, not concatenated command string
      expect(file).toBe('mw');
      expect(args).toContain('--token');
      expect(args).toContain('mock-access-token');
      expect(options?.maxBuffer).toBe(20 * 1024 * 1024);
      expect(options?.env?.NODE_OPTIONS).toContain('--max-old-space-size=384');
      callback?.(null, 'command output', '');
      return {} as any;
    });

    const result = await executeCli('mw', ['project', 'list']);

    expect(result).toMatchObject({
      stdout: 'command output',
      stderr: '',
      exitCode: 0,
    });
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
    expect(execFileMock).toHaveBeenCalledTimes(1);
  });

  it('does not duplicate token flag when already provided', async () => {
    (getCurrentSessionId as any).mockReturnValue('session-123');
    (sessionManager.getSession as any).mockResolvedValue(mockSession);

    execFileMock.mockImplementation((file: string, args: string[], options: any, callback: any) => {
      const tokenCount = args.filter(a => a === '--token').length;
      expect(tokenCount).toBe(1);
      expect(args).toContain('provided-token');
      callback?.(null, 'ok', '');
      return {} as any;
    });

    const result = await executeCli('mw', ['project', 'list', '--token', 'provided-token']);

    expect(result.exitCode).toBe(0);
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('propagates non-zero exit codes with redacted tokens', async () => {
    (getCurrentSessionId as any).mockReturnValue('session-123');
    (sessionManager.getSession as any).mockResolvedValue(mockSession);

    execFileMock.mockImplementation((file: string, args: string[], options: any, callback: any) => {
      const error: any = new Error('execution failed');
      error.code = 127;
      error.stdout = '';
      error.stderr = '';
      callback?.(error, '', '');
      return {} as any;
    });

    const result = await executeCli('mw', ['project', 'list']);

    expect(result.exitCode).toBe(127);
    expect(result.stderr).toContain('--token [REDACTED]');
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('respects custom heap and additional Node options', async () => {
    (getCurrentSessionId as any).mockReturnValue('session-123');
    (sessionManager.getSession as any).mockResolvedValue(mockSession);
    process.env.NODE_OPTIONS = '--trace-warnings';
    process.env.MCP_CLI_MAX_HEAP_MB = '512';
    process.env.MCP_CLI_NODE_OPTIONS = '--no-deprecation';

    execFileMock.mockImplementation((file: string, args: string[], options: any, callback: any) => {
      expect(options?.env?.NODE_OPTIONS).toContain('--trace-warnings');
      expect(options?.env?.NODE_OPTIONS).toContain('--no-deprecation');
      expect(options?.env?.NODE_OPTIONS).toContain('--max-old-space-size=512');
      callback?.(null, 'ok', '');
      return {} as any;
    });

    const result = await executeCli('mw', ['status', '--json']);
    expect(result.exitCode).toBe(0);
  });

  it('returns friendly message when stdout exceeds buffer', async () => {
    (getCurrentSessionId as any).mockReturnValue('session-123');
    (sessionManager.getSession as any).mockResolvedValue(mockSession);

    execFileMock.mockImplementation((file: string, args: string[], options: any, callback: any) => {
      const error: any = new Error('stdout maxBuffer exceeded');
      error.code = 1;
      error.stdout = '';
      error.stderr = '';
      callback?.(error, '', '');
      return {} as any;
    });

    const result = await executeCli('mw', ['project', 'list']);

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain('Command output exceeded the configured 20 MB limit');
    expect(result.stderr).toContain('MCP_CLI_MAX_BUFFER_MB');
  });
});

afterAll(() => {
  process.env.NODE_OPTIONS = ORIGINAL_ENV.NODE_OPTIONS;
  process.env.MCP_CLI_MAX_HEAP_MB = ORIGINAL_ENV.MCP_CLI_MAX_HEAP_MB;
  process.env.MCP_CLI_MAX_BUFFER_MB = ORIGINAL_ENV.MCP_CLI_MAX_BUFFER_MB;
  process.env.MCP_CLI_NODE_OPTIONS = ORIGINAL_ENV.MCP_CLI_NODE_OPTIONS;
});
