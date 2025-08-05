import { redisClient } from '../utils/redis-client.js';
import { logger } from '../utils/logger.js';

export interface UserSession {
  sessionId: string;
  userId: string;
  oauthAccessToken: string;
  refreshToken?: string;
  expiresAt: Date;
  currentContext: {
    projectId?: string;
    serverId?: string;
    orgId?: string;
  };
  accessibleProjects?: string[];
  lastAccessed: Date;
  scopes?: string[];
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
    sessionData: Omit<UserSession, 'sessionId' | 'lastAccessed'>,
    options: SessionCreateOptions = {}
  ): Promise<string> {
    const sessionId = this.generateSessionId();
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

      // Store session data
      await redisClient.set(sessionKey, JSON.stringify(session), ttl);

      // Add session to user's session list
      await redisClient.getClient().sadd(userSessionsKey, sessionId);
      await redisClient.expire(userSessionsKey, ttl);

      logger.info(`Session created for user ${userId}: ${sessionId}`);
      return sessionId;

    } catch (error) {
      logger.error('Failed to create session:', error);
      throw new Error('Session creation failed');
    }
  }

  async getSession(sessionId: string): Promise<UserSession | null> {
    try {
      const sessionKey = this.getSessionKey(sessionId);
      const sessionData = await redisClient.get(sessionKey);

      if (!sessionData) {
        return null;
      }

      const session: UserSession = JSON.parse(sessionData);
      
      // Check if session is expired
      if (session.expiresAt && new Date() > new Date(session.expiresAt)) {
        await this.destroySession(sessionId);
        return null;
      }

      // Update last accessed time
      session.lastAccessed = new Date();
      await redisClient.set(sessionKey, JSON.stringify(session));

      return session;

    } catch (error) {
      logger.error('Failed to get session:', error);
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
          logger.warn(`Session data corrupted for ${sessionId}, deleting key anyway`);
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