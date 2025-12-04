import { describe, it, expect, beforeEach } from 'vitest';

import { execFileMock, resetExecMock } from '../helpers/child-process-exec-mock.ts';
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
  mittwaldAccessTokenExpiresAt: new Date(Date.now() + 60_000),
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

    execFileMock.mockImplementation((file: string, args: string[], options: any, callback: any) => {
      // execFile passes args as array, check that token is injected
      expect(args).toContain('--token');
      expect(args).toContain('integration-access-token');
      callback?.(null, 'ok', '');
      return {} as any;
    });

    const result = await runWithSessionContext(sessionId, () =>
      executeCli('mw', ['project', 'list'])
    );

    expect(result).toMatchObject({ stdout: 'ok', stderr: '', exitCode: 0 });
  });

  it('respects explicit token arguments without overwriting', async () => {
    const manager = new SessionManager();
    const sessionId = await manager.createSession('user-1', buildSessionData());

    execFileMock.mockImplementation((file: string, args: string[], options: any, callback: any) => {
      // Count --token occurrences in args
      const tokenCount = args.filter(arg => arg === '--token').length;
      expect(tokenCount).toBe(1);
      // The explicit token should be preserved
      const tokenIndex = args.indexOf('--token');
      expect(args[tokenIndex + 1]).toBe('cli-provided');
      callback?.(null, 'ok', '');
      return {} as any;
    });

    const result = await runWithSessionContext(sessionId, () =>
      executeCli('mw', ['project', 'list', '--token', 'cli-provided'])
    );

    expect(result.exitCode).toBe(0);
  });

  it('uses refreshed session token after session update', async () => {
    const manager = new SessionManager();
    const sessionId = await manager.createSession('user-1', {
      ...buildSessionData(),
      mittwaldAccessToken: 'stale-token',
      expiresAt: new Date(Date.now() - 1_000),
      mittwaldAccessTokenExpiresAt: new Date(Date.now() - 1_000),
    });

    await manager.upsertSession(sessionId, 'user-1', {
      mittwaldAccessToken: 'updated-access-token',
      mittwaldRefreshToken: 'integration-refresh-token',
      oauthToken: 'integration-jwt',
      scope: 'profile',
      expiresAt: new Date(Date.now() + 60_000),
      mittwaldAccessTokenExpiresAt: new Date(Date.now() + 60_000),
      currentContext: {},
      accessibleProjects: [],
      scopes: ['profile'],
    });

    execFileMock.mockImplementation((file: string, args: string[], options: any, callback: any) => {
      // Check that the updated token is used
      expect(args).toContain('--token');
      expect(args).toContain('updated-access-token');
      callback?.(null, 'ok', '');
      return {} as any;
    });

    const result = await runWithSessionContext(sessionId, () =>
      executeCli('mw', ['project', 'list'])
    );

    expect(result.exitCode).toBe(0);
  });
});
