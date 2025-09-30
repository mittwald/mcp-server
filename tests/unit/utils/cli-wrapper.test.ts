import { describe, it, expect, beforeEach, vi } from 'vitest';
import { execMock, resetExecMock } from '../../helpers/child-process-exec-mock.ts';

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

describe('executeCli', () => {
  beforeEach(() => {
    resetExecMock();
    (sessionManager.getSession as any).mockReset();
    (getCurrentSessionId as any).mockReset();
  });

  it('injects session token when no token flag present', async () => {
    (getCurrentSessionId as any).mockReturnValue('session-123');
    (sessionManager.getSession as any).mockResolvedValue(mockSession);

    execMock.mockImplementation((command: string, optionsOrCallback: any, maybeCallback?: any) => {
      const callback = typeof optionsOrCallback === 'function' ? optionsOrCallback : maybeCallback;
      expect(command).toContain('--token mock-access-token');
      callback?.(null, 'command output', '');
      return {} as any;
    });

    const result = await executeCli('mw', ['project', 'list']);

    expect(result).toEqual({
      stdout: 'command output',
      stderr: '',
      exitCode: 0,
    });
    expect(execMock).toHaveBeenCalledTimes(1);
  });

  it('does not duplicate token flag when already provided', async () => {
    (getCurrentSessionId as any).mockReturnValue('session-123');
    (sessionManager.getSession as any).mockResolvedValue(mockSession);

    execMock.mockImplementation((command: string, optionsOrCallback: any, maybeCallback?: any) => {
      const callback = typeof optionsOrCallback === 'function' ? optionsOrCallback : maybeCallback;
      const occurrences = (command.match(/--token/g) || []).length;
      expect(occurrences).toBe(1);
      expect(command).toContain('--token provided-token');
      callback?.(null, 'ok', '');
      return {} as any;
    });

    const result = await executeCli('mw', ['project', 'list', '--token', 'provided-token']);

    expect(result.exitCode).toBe(0);
  });

  it('propagates non-zero exit codes with redacted tokens', async () => {
    (getCurrentSessionId as any).mockReturnValue('session-123');
    (sessionManager.getSession as any).mockResolvedValue(mockSession);

    execMock.mockImplementation((command: string, optionsOrCallback: any, maybeCallback?: any) => {
      const callback = typeof optionsOrCallback === 'function' ? optionsOrCallback : maybeCallback;
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
  });
});
