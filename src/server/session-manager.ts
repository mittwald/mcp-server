import { redisClient } from '../utils/redis-client.js';
import { logger } from '../utils/logger.js';
import { refreshMittwaldAccessToken, MittwaldTokenServiceError } from './mittwald-token-service.js';

const TOKEN_REFRESH_SKEW_MS = 60 * 1000; // refresh 1 minute before expiry

export interface UserSession {
  sessionId: string;
  userId: string;
  mittwaldAccessToken: string;
  mittwaldRefreshToken?: string;
  oauthToken?: string;
  scope?: string;
  scopeSource?: string;
  requestedScope?: string;
  scopes?: string[];
  resource?: string;
  expiresAt: Date;
  mittwaldAccessTokenExpiresAt?: Date;
  mittwaldRefreshTokenExpiresAt?: Date;
  currentContext: {
    projectId?: string;
    serverId?: string;
    orgId?: string;
  };
  accessibleProjects?: string[];
  cache?: {
    appToProject?: Record<string, string>; // installationId -> projectId
  };
  lastAccessed: Date;
  authenticationMode?: 'bridge' | 'direct-token';
}

export interface SessionCreateOptions {
  ttlSeconds?: number;
}

/**
 * Outcome of trying to refresh a session's Mittwald tokens.
 *
 * `deferred` is the important one: the refresh did not succeed, but the session is still valid and
 * must survive, so a transient failure cannot force the user to authenticate again.
 */
type SessionRefreshResult =
  | { status: 'refreshed'; session: UserSession }
  | { status: 'revoked' }
  | { status: 'deferred' };

export class SessionManager {
  private readonly SESSION_PREFIX = 'session:';
  private readonly USER_SESSIONS_PREFIX = 'user_sessions:';
  private readonly DEFAULT_TTL = 8 * 60 * 60; // 8 hours in seconds

  constructor() {}

  private getSessionKey(sessionId: string): string {
    return `${this.SESSION_PREFIX}${sessionId}`;
  }

  private getUserSessionsKey(userId: string): string {
    return `${this.USER_SESSIONS_PREFIX}${userId}`;
  }

  async createSession(
    userId: string, 
    sessionData: Omit<UserSession, 'sessionId' | 'userId' | 'lastAccessed'>,
    options: SessionCreateOptions = {}
  ): Promise<string> {
    const sessionId = this.generateSessionId();
    await this.upsertSession(sessionId, userId, sessionData, options);
    return sessionId;
  }

  async upsertSession(
    sessionId: string,
    userId: string,
    sessionData: Omit<UserSession, 'sessionId' | 'userId' | 'lastAccessed'>,
    options: SessionCreateOptions = {}
  ): Promise<void> {
    const ttl = options.ttlSeconds || this.DEFAULT_TTL;

    const session: UserSession = {
      ...sessionData,
      sessionId,
      userId,
      lastAccessed: new Date(),
    };

    try {
      const sessionKey = this.getSessionKey(sessionId);
      const userSessionsKey = this.getUserSessionsKey(userId);

      await redisClient.set(sessionKey, JSON.stringify(session), ttl);

      await redisClient.getClient().sadd(userSessionsKey, sessionId);
      await redisClient.expire(userSessionsKey, ttl);

      logger.info(`Session stored for user ${userId}: ${sessionId}`);
    } catch (error) {
      logger.error('Failed to upsert session:', error);
      throw new Error('Session upsert failed');
    }
  }

  async getSession(sessionId: string): Promise<UserSession | null> {
    try {
      const sessionKey = this.getSessionKey(sessionId);
      const sessionData = await redisClient.get(sessionKey);

      if (!sessionData) {
        return null;
      }

      const hydrated = this.hydrateSession(JSON.parse(sessionData) as UserSession);
      const updatedSession = await this.ensureSessionFresh(sessionId, hydrated);

      if (!updatedSession) {
        return null;
      }

      updatedSession.lastAccessed = new Date();

      const ttl = await redisClient.ttl(sessionKey);
      const ttlSeconds = ttl > 0 ? ttl : this.resolveSessionTtl(updatedSession);
      await redisClient.set(sessionKey, JSON.stringify(updatedSession), ttlSeconds);

      return updatedSession;

    } catch (error) {
      logger.error('Failed to get session:', error);
      return null;
    }
  }

  private hydrateSession(raw: UserSession): UserSession {
    const session: UserSession = {
      ...raw,
      expiresAt: raw.expiresAt ? new Date(raw.expiresAt) : raw.expiresAt,
      lastAccessed: raw.lastAccessed ? new Date(raw.lastAccessed) : new Date(),
      mittwaldAccessTokenExpiresAt: raw.mittwaldAccessTokenExpiresAt
        ? new Date(raw.mittwaldAccessTokenExpiresAt)
        : raw.mittwaldAccessTokenExpiresAt,
      mittwaldRefreshTokenExpiresAt: raw.mittwaldRefreshTokenExpiresAt
        ? new Date(raw.mittwaldRefreshTokenExpiresAt)
        : raw.mittwaldRefreshTokenExpiresAt,
    };

    return session;
  }

  private async ensureSessionFresh(sessionId: string, session: UserSession): Promise<UserSession | null> {
    const now = Date.now();
    const accessExpiryMs = session.mittwaldAccessTokenExpiresAt?.getTime()
      ?? session.expiresAt?.getTime();

    if (!accessExpiryMs) {
      return session;
    }

    const timeUntilExpiry = accessExpiryMs - now;

    if (session.authenticationMode === 'direct-token') {
      if (timeUntilExpiry <= 0) {
        await this.destroySession(sessionId);
        return null;
      }
      return session;
    }

    if (timeUntilExpiry > TOKEN_REFRESH_SKEW_MS) {
      return session;
    }

    const result = await this.refreshSessionTokens(sessionId, session);

    switch (result.status) {
      case 'refreshed':
        return result.session;

      case 'revoked':
        // The refresh token is gone or rejected. Re-authentication is genuinely required.
        logger.info(`Session ${sessionId} can no longer be refreshed; discarding it`);
        await this.destroySession(sessionId);
        return null;

      case 'deferred':
        // Refresh did not work *this time*, but the grant is still good. Keep the session: the
        // bearer token on the next request carries a Mittwald token of its own, which the MCP
        // transport applies to the session and which may already be fresher than what we hold.
        // Throwing the session away here turns a transient blip into a forced re-login.
        logger.warn(`Keeping session ${sessionId} despite a failed token refresh`);
        return session;
    }
  }

  private calculateTtl(expiresAt?: Date): number | undefined {
    if (!expiresAt) {
      return undefined;
    }

    const seconds = Math.floor((expiresAt.getTime() - Date.now()) / 1000);
    if (seconds <= 0) {
      return undefined;
    }

    return Math.max(60, seconds);
  }

  /**
   * How long the session record should live in Redis.
   *
   * A session stays useful for as long as it can still be refreshed, so this tracks the refresh
   * token — not the access token. Keying it to the access token expiry (which can be well under an
   * hour) made the record vanish from Redis at the exact moment a refresh was due, so the client
   * got "Session expired" instead of a renewed session.
   */
  resolveSessionTtl(
    session: Pick<UserSession, 'mittwaldRefreshTokenExpiresAt' | 'expiresAt' | 'authenticationMode'>,
    minimumSeconds?: number
  ): number {
    // A direct API token is never refreshed, so its own expiry is the real ceiling.
    if (session.authenticationMode === 'direct-token') {
      return this.calculateTtl(session.expiresAt) ?? this.DEFAULT_TTL;
    }

    const base = this.calculateTtl(session.mittwaldRefreshTokenExpiresAt) ?? this.DEFAULT_TTL;

    // The record has to outlive the bearer token that addresses it. If it expires first the client
    // is holding a token it believes is valid and gets "Session expired", with no way to renew.
    return Math.max(base, minimumSeconds ?? 0);
  }

  private async refreshSessionTokens(sessionId: string, session: UserSession): Promise<SessionRefreshResult> {
    if (!session.mittwaldRefreshToken) {
      logger.debug(`Session ${sessionId} has no refresh token; cannot refresh`);
      return { status: 'revoked' };
    }

    try {
      const refreshResponse = await refreshMittwaldAccessToken({
        refreshToken: session.mittwaldRefreshToken,
        scope: session.requestedScope || session.scope,
      });

      const now = Date.now();
      const expiresIn = typeof refreshResponse.expires_in === 'number'
        ? refreshResponse.expires_in
        : undefined;
      const accessExpiresAt = expiresIn ? new Date(now + expiresIn * 1000) : session.expiresAt;

      const refreshExpiresInRaw = (refreshResponse as Record<string, unknown>).refresh_token_expires_in;
      const refreshExpiresAt = typeof refreshExpiresInRaw === 'number'
        ? new Date(now + refreshExpiresInRaw * 1000)
        : session.mittwaldRefreshTokenExpiresAt;

      const scopeString = typeof refreshResponse.scope === 'string'
        ? refreshResponse.scope
        : session.scope;
      const scopes = scopeString
        ? scopeString.split(/\s+/).filter(Boolean)
        : session.scopes;

      const updatedSession: UserSession = {
        ...session,
        mittwaldAccessToken: refreshResponse.access_token,
        mittwaldRefreshToken: refreshResponse.refresh_token || session.mittwaldRefreshToken,
        scope: scopeString,
        scopes,
        expiresAt: accessExpiresAt ?? new Date(now + this.DEFAULT_TTL * 1000),
        mittwaldAccessTokenExpiresAt: accessExpiresAt ?? session.mittwaldAccessTokenExpiresAt,
        mittwaldRefreshTokenExpiresAt: refreshExpiresAt,
        authenticationMode: session.authenticationMode,
      };

      const ttlSeconds = this.resolveSessionTtl(updatedSession);

      await this.upsertSession(sessionId, session.userId, {
        mittwaldAccessToken: updatedSession.mittwaldAccessToken,
        mittwaldRefreshToken: updatedSession.mittwaldRefreshToken,
        oauthToken: updatedSession.oauthToken,
        scope: updatedSession.scope,
        scopeSource: updatedSession.scopeSource,
        requestedScope: updatedSession.requestedScope,
        scopes: updatedSession.scopes,
        resource: updatedSession.resource,
        expiresAt: updatedSession.expiresAt,
        mittwaldAccessTokenExpiresAt: updatedSession.mittwaldAccessTokenExpiresAt,
        mittwaldRefreshTokenExpiresAt: updatedSession.mittwaldRefreshTokenExpiresAt,
        currentContext: updatedSession.currentContext,
        accessibleProjects: updatedSession.accessibleProjects,
        cache: updatedSession.cache,
        authenticationMode: updatedSession.authenticationMode,
      }, { ttlSeconds });

      return { status: 'refreshed', session: updatedSession };
    } catch (error) {
      if (error instanceof MittwaldTokenServiceError) {
        logger.warn(
          `Mittwald token refresh failed for session ${sessionId} (${error.reason}): ${error.message}`
        );
        return error.reason === 'revoked' ? { status: 'revoked' } : { status: 'deferred' };
      }

      logger.error(`Unexpected error refreshing Mittwald token for session ${sessionId}:`, error);
      return { status: 'deferred' };
    }
  }

  async updateSession(sessionId: string, updates: Partial<UserSession>): Promise<void> {
    try {
      const session = await this.getSession(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      const updatedSession: UserSession = {
        ...session,
        ...updates,
        sessionId, // Ensure sessionId cannot be changed
        lastAccessed: new Date(),
      };

      const sessionKey = this.getSessionKey(sessionId);
      await redisClient.set(sessionKey, JSON.stringify(updatedSession));

      logger.debug(`Session updated: ${sessionId}`);
    } catch (error) {
      logger.error('Failed to update session:', error);
      throw new Error('Session update failed');
    }
  }

  async updateContext(sessionId: string, context: UserSession['currentContext']): Promise<void> {
    await this.updateSession(sessionId, { currentContext: context });
  }

  async destroySession(sessionId: string): Promise<void> {
    try {
      const sessionKey = this.getSessionKey(sessionId);
      
      // Get session data directly from Redis to avoid circular dependency with getSession()
      const sessionData = await redisClient.get(sessionKey);
      
      if (sessionData) {
        try {
          const session: UserSession = JSON.parse(sessionData);
          const userSessionsKey = this.getUserSessionsKey(session.userId);
          await redisClient.getClient().srem(userSessionsKey, sessionId);
        } catch (parseError) {
          // If session data is corrupted, we'll still delete the key
          logger.warn(`Session data corrupted for ${sessionId}, deleting key anyway`, {
            error: parseError instanceof Error ? parseError.message : String(parseError),
          });
        }
      }

      await redisClient.del(sessionKey);
      logger.info(`Session destroyed: ${sessionId}`);

    } catch (error) {
      logger.error('Failed to destroy session:', error);
      throw new Error('Session destruction failed');
    }
  }

  async destroyUserSessions(userId: string): Promise<void> {
    try {
      const userSessionsKey = this.getUserSessionsKey(userId);
      const sessionIds = await redisClient.getClient().smembers(userSessionsKey);

      // Destroy all user sessions
      for (const sessionId of sessionIds) {
        await this.destroySession(sessionId);
      }

      // Clean up user sessions set
      await redisClient.del(userSessionsKey);
      logger.info(`All sessions destroyed for user: ${userId}`);

    } catch (error) {
      logger.error('Failed to destroy user sessions:', error);
      throw new Error('User sessions destruction failed');
    }
  }

  async getUserSessions(userId: string): Promise<UserSession[]> {
    try {
      const userSessionsKey = this.getUserSessionsKey(userId);
      const sessionIds = await redisClient.getClient().smembers(userSessionsKey);

      const sessions: UserSession[] = [];
      for (const sessionId of sessionIds) {
        const session = await this.getSession(sessionId);
        if (session) {
          sessions.push(session);
        }
      }

      return sessions;

    } catch (error) {
      logger.error('Failed to get user sessions:', error);
      return [];
    }
  }

  async validateSession(sessionId: string): Promise<boolean> {
    const session = await this.getSession(sessionId);
    return session !== null;
  }

  async refreshSessionTTL(sessionId: string, ttlSeconds?: number): Promise<void> {
    const ttl = ttlSeconds || this.DEFAULT_TTL;
    const sessionKey = this.getSessionKey(sessionId);
    await redisClient.expire(sessionKey, ttl);
  }

  private generateSessionId(): string {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2);
    return `${timestamp}-${randomPart}`;
  }

  async cleanupExpiredSessions(): Promise<number> {
    try {
      const pattern = `${this.SESSION_PREFIX}*`;
      const keys = await redisClient.keys(pattern);
      let cleanedCount = 0;

      for (const key of keys) {
        const sessionData = await redisClient.get(key);
        if (sessionData) {
          try {
            const session: UserSession = JSON.parse(sessionData);
            if (session.expiresAt && new Date() > new Date(session.expiresAt)) {
              await this.destroySession(session.sessionId);
              cleanedCount++;
            }
          } catch (parseError) {
            // Invalid session data, clean it up
            logger.warn('Removing invalid session entry during cleanup', {
              key,
              error: parseError instanceof Error ? parseError.message : String(parseError),
            });
            await redisClient.del(key);
            cleanedCount++;
          }
        }
      }

      if (cleanedCount > 0) {
        logger.info(`Cleaned up ${cleanedCount} expired sessions`);
      }

      return cleanedCount;

    } catch (error) {
      logger.error('Failed to cleanup expired sessions:', error);
      return 0;
    }
  }
}

export const sessionManager = new SessionManager();
