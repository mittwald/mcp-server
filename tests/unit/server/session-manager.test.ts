import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { resetRedisMock } from '../../helpers/redis-mock.ts';

vi.mock('../../../src/server/mittwald-token-service.js', () => ({
  refreshMittwaldAccessToken: vi.fn(),
  MittwaldTokenServiceError: class extends Error {
    reason: string;
    constructor(message: string, reason = 'transport') {
      super(message);
      this.reason = reason;
    }
  },
}));

import {
  refreshMittwaldAccessToken,
  MittwaldTokenServiceError,
} from '../../../src/server/mittwald-token-service.js';
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

  it('keeps the session when a refresh fails for a reason the user cannot fix', async () => {
    // A misconfigured server or an unreachable Mittwald must not cost the user their session:
    // that turns a transient blip into a forced re-authentication mid-conversation.
    for (const reason of ['configuration', 'transport'] as const) {
      const manager = new SessionManager();

      mockRefreshMittwaldAccessToken.mockRejectedValue(
        new MittwaldTokenServiceError('refresh unavailable', reason)
      );

      const sessionId = await manager.createSession('user-1', {
        ...baseSessionData(),
        expiresAt: new Date(Date.now() - 1_000),
        mittwaldAccessTokenExpiresAt: new Date(Date.now() - 1_000),
      });

      const session = await manager.getSession(sessionId);

      expect(session, `expected session to survive a '${reason}' failure`).not.toBeNull();
      expect(session?.mittwaldAccessToken).toBe('access-token');
    }
  });

  it('discards the session when Mittwald rejects the refresh token', async () => {
    const manager = new SessionManager();

    mockRefreshMittwaldAccessToken.mockRejectedValue(
      new MittwaldTokenServiceError('Mittwald token refresh failed', 'revoked')
    );

    const sessionId = await manager.createSession('user-1', {
      ...baseSessionData(),
      expiresAt: new Date(Date.now() - 1_000),
      mittwaldAccessTokenExpiresAt: new Date(Date.now() - 1_000),
    });

    expect(await manager.getSession(sessionId)).toBeNull();
  });

  it('keeps the session record alive for as long as it can still be refreshed', () => {
    const manager = new SessionManager();
    const now = Date.now();

    // The access token expires in a minute, the refresh token not for another day. Tying the Redis
    // TTL to the access token deleted the record exactly when a refresh became due.
    const ttl = manager.resolveSessionTtl({
      expiresAt: new Date(now + 60_000),
      mittwaldRefreshTokenExpiresAt: new Date(now + 24 * 60 * 60 * 1000),
      authenticationMode: 'bridge',
    });

    expect(ttl).toBeGreaterThan(23 * 60 * 60);
  });

  it('keeps the session record alive at least as long as the bearer token addressing it', () => {
    const manager = new SessionManager();

    // The bridge can issue a token that outlives the default session TTL. If the record expires
    // first, the client is told "Session expired" while holding a token it believes is valid —
    // and with no working refresh, that means a browser sign-in.
    const twentyFourHours = 24 * 60 * 60;

    const ttl = manager.resolveSessionTtl(
      {
        expiresAt: new Date(Date.now() + twentyFourHours * 1000),
        mittwaldRefreshTokenExpiresAt: undefined,
        authenticationMode: 'bridge',
      },
      twentyFourHours
    );

    expect(ttl).toBeGreaterThanOrEqual(twentyFourHours);
  });

  it('caps the session record at the token expiry for direct API tokens', () => {
    const manager = new SessionManager();

    // Direct tokens are never refreshed, so their own expiry is the real ceiling.
    const ttl = manager.resolveSessionTtl({
      expiresAt: new Date(Date.now() + 600_000),
      mittwaldRefreshTokenExpiresAt: undefined,
      authenticationMode: 'direct-token',
    });

    expect(ttl).toBeLessThanOrEqual(600);
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
