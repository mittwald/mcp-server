import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { resetRedisMock } from '../../helpers/redis-mock.ts';

vi.mock('../../../src/server/mittwald-token-service.js', () => ({
  refreshMittwaldAccessToken: vi.fn(),
  MittwaldTokenServiceError: class extends Error {},
}));

import { refreshMittwaldAccessToken } from '../../../src/server/mittwald-token-service.js';
import { SessionManager } from '../../../src/server/session-manager.js';

const mockRefreshMittwaldAccessToken = vi.mocked(refreshMittwaldAccessToken);

const baseSessionData = () => ({
  mittwaldAccessToken: 'access-token',
  mittwaldRefreshToken: 'refresh-token',
  oauthToken: 'jwt-token',
  scope: 'profile',
  expiresAt: new Date(Date.now() + 60_000),
  mittwaldAccessTokenExpiresAt: new Date(Date.now() + 60_000),
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
    mockRefreshMittwaldAccessToken.mockReset();
  });

  it('creates and retrieves a session', async () => {
    const manager = new SessionManager();
    const sessionId = await manager.createSession('user-1', baseSessionData());

    const session = await manager.getSession(sessionId);

    expect(session).not.toBeNull();
    expect(session?.userId).toBe('user-1');
    expect(session?.mittwaldAccessToken).toBe('access-token');
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

  it('refreshes access token using Mittwald refresh token when expired', async () => {
    vi.useFakeTimers();
    const now = new Date('2025-01-01T00:00:00.000Z');
    vi.setSystemTime(now);

    const manager = new SessionManager();

    mockRefreshMittwaldAccessToken.mockResolvedValue({
      access_token: 'new-access-token',
      token_type: 'Bearer',
      expires_in: 7200,
      refresh_token: 'rotated-refresh-token',
      scope: 'profile extended',
    });

    const sessionId = await manager.createSession('user-1', {
      ...baseSessionData(),
      expiresAt: new Date(now.getTime() - 1_000),
      mittwaldAccessTokenExpiresAt: new Date(now.getTime() - 1_000),
    });

    const session = await manager.getSession(sessionId);

    expect(mockRefreshMittwaldAccessToken).toHaveBeenCalledWith({
      refreshToken: 'refresh-token',
      scope: 'profile',
    });

    expect(session).not.toBeNull();
    expect(session?.mittwaldAccessToken).toBe('new-access-token');
    expect(session?.mittwaldRefreshToken).toBe('rotated-refresh-token');
    expect(session?.scope).toBe('profile extended');
    expect(session?.mittwaldAccessTokenExpiresAt?.getTime()).toBeGreaterThan(now.getTime());
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

  it('upserts a session with a predetermined ID', async () => {
    const manager = new SessionManager();
    const customId = 'custom-session-id';

    await manager.upsertSession('custom-session-id', 'user-2', baseSessionData());

    const stored = await manager.getSession(customId);
    expect(stored).not.toBeNull();
    expect(stored?.sessionId).toBe(customId);
    expect(stored?.mittwaldAccessToken).toBe('access-token');
  });
});
