import { describe, it, expect, beforeEach } from 'vitest';

import { execMock, resetExecMock } from '../helpers/child-process-exec-mock.ts';
import { resetRedisMock } from '../helpers/redis-mock.ts';

import { runWithSessionContext } from '../../src/utils/execution-context.js';
import { executeCli } from '../../src/utils/cli-wrapper.js';
import { SessionManager } from '../../src/server/session-manager.js';

const buildSessionData = () => ({
  mittwaldAccessToken: 'integration-access-token',
  mittwaldRefreshToken: 'integration-refresh-token',
  oauthToken: 'integration-jwt',
  scope: 'profile',
  expiresAt: new Date(Date.now() + 60_000),
  currentContext: {},
  accessibleProjects: [],
  scopes: ['profile'],
});

describe('CLI execution with session context (integration)', () => {
  beforeEach(() => {
    resetRedisMock();
    resetExecMock();
  });

  it('injects the session token into CLI commands when none provided', async () => {
    const manager = new SessionManager();
    const sessionId = await manager.createSession('user-1', buildSessionData());

    execMock.mockImplementation((command: string, optionsOrCallback: any, maybeCallback?: any) => {
      const callback = typeof optionsOrCallback === 'function' ? optionsOrCallback : maybeCallback;
      expect(command).toContain('--token integration-access-token');
      callback?.(null, 'ok', '');
      return {} as any;
    });

    const result = await runWithSessionContext(sessionId, () =>
      executeCli('mw', ['project', 'list'])
    );

    expect(result).toEqual({ stdout: 'ok', stderr: '', exitCode: 0 });
  });

  it('respects explicit token arguments without overwriting', async () => {
    const manager = new SessionManager();
    const sessionId = await manager.createSession('user-1', buildSessionData());

    execMock.mockImplementation((command: string, optionsOrCallback: any, maybeCallback?: any) => {
      const callback = typeof optionsOrCallback === 'function' ? optionsOrCallback : maybeCallback;
      const matches = command.match(/--token/g) || [];
      expect(matches).toHaveLength(1);
      expect(command).toContain('--token cli-provided');
      callback?.(null, 'ok', '');
      return {} as any;
    });

    const result = await runWithSessionContext(sessionId, () =>
      executeCli('mw', ['project', 'list', '--token', 'cli-provided'])
    );

    expect(result.exitCode).toBe(0);
  });
});
