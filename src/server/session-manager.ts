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
  lastAccessed: Date;
  authenticationMode?: 'bridge' | 'direct-token';
}

export interface SessionCreateOptions {
  ttlSeconds?: number;
}

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
      const ttlSeconds = ttl > 0 ? ttl : this.calculateTtl(updatedSession.expiresAt);
      await redisClient.set(sessionKey, JSON.stringify(updatedSession), ttlSeconds ?? undefined);

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

    if (timeUntilExpiry <= -TOKEN_REFRESH_SKEW_MS) {
      return await this.refreshSessionTokens(sessionId, session);
    }

    if (timeUntilExpiry <= TOKEN_REFRESH_SKEW_MS) {
      const refreshed = await this.refreshSessionTokens(sessionId, session);
      return refreshed ?? session;
    }

    return session;
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

  private async refreshSessionTokens(sessionId: string, session: UserSession): Promise<UserSession | null> {
    if (!session.mittwaldRefreshToken) {
      logger.debug(`Session ${sessionId} missing refresh token; destroying session`);
      await this.destroySession(sessionId);
      return null;
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

      const ttlSeconds = this.calculateTtl(updatedSession.expiresAt) ?? this.DEFAULT_TTL;

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
        authenticationMode: updatedSession.authenticationMode,
      }, { ttlSeconds });

      return updatedSession;
    } catch (error) {
      if (error instanceof MittwaldTokenServiceError) {
        logger.warn(`Mittwald token refresh failed for session ${sessionId}: ${error.message}`);
      } else {
        logger.error(`Unexpected error refreshing Mittwald token for session ${sessionId}:`, error);
      }

      await this.destroySession(sessionId);
      return null;
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
