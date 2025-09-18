import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { resetRedisMock } from '../../helpers/redis-mock.ts';

import { SessionManager } from '../../../src/server/session-manager.js';

const baseSessionData = () => ({
  oauthAccessToken: 'access-token',
  refreshToken: 'refresh-token',
  expiresAt: new Date(Date.now() + 60_000),
  currentContext: {},
  accessibleProjects: [],
  scopes: ['profile'],
});

describe('SessionManager', () => {
  beforeEach(() => {
    resetRedisMock();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('creates and retrieves a session', async () => {
    const manager = new SessionManager();
    const sessionId = await manager.createSession('user-1', baseSessionData());

    const session = await manager.getSession(sessionId);

    expect(session).not.toBeNull();
    expect(session?.userId).toBe('user-1');
    expect(session?.oauthAccessToken).toBe('access-token');
  });

  it('returns null for expired sessions and removes them', async () => {
    vi.useFakeTimers();
    const manager = new SessionManager();

    const now = new Date('2024-01-01T00:00:00.000Z');
    vi.setSystemTime(now);

    const sessionId = await manager.createSession(
      'user-1',
      {
        ...baseSessionData(),
        expiresAt: new Date(now.getTime() + 1_000),
      },
      { ttlSeconds: 1 }
    );

    vi.advanceTimersByTime(2_000);

    const session = await manager.getSession(sessionId);
    expect(session).toBeNull();
  });

  it('cleans up sessions with expired metadata', async () => {
    const manager = new SessionManager();

    const sessionId = await manager.createSession('user-1', {
      ...baseSessionData(),
      expiresAt: new Date(Date.now() - 5_000),
    });

    const cleaned = await manager.cleanupExpiredSessions();
    expect(cleaned).toBeGreaterThanOrEqual(1);

    const after = await manager.getSession(sessionId);
    expect(after).toBeNull();
  });

  it('destroys session and removes it from user membership set', async () => {
    const manager = new SessionManager();

    const sessionId = await manager.createSession('user-1', baseSessionData());

    await manager.destroySession(sessionId);

    const sessions = await manager.getUserSessions('user-1');
    expect(sessions).toHaveLength(0);
  });
});
