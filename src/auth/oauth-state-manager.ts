import * as openidClient from 'openid-client';
import { redisClient } from '../utils/redis-client.js';
import { logger } from '../utils/logger.js';

export interface OAuthState {
  state: string;
  codeVerifier: string;
  codeChallenge: string;
  sessionId?: string;
  createdAt: Date;
  expiresAt: Date;
}

export class OAuthStateManager {
  private readonly STATE_PREFIX = 'oauth_state:';
  private readonly STATE_TTL = 600; // 10 minutes

  async createState(sessionId?: string): Promise<OAuthState> {
    const state = this.generateState();
    const now = new Date();
    
    const oauthState: OAuthState = {
      state,
      codeVerifier: '', // Will be set by OAuth client
      codeChallenge: '', // Will be set by OAuth client
      sessionId,
      createdAt: now,
      expiresAt: new Date(now.getTime() + this.STATE_TTL * 1000),
    };

    try {
      await redisClient.set(
        `${this.STATE_PREFIX}${state}`,
        JSON.stringify(oauthState),
        this.STATE_TTL
      );

      logger.debug('OAuth state created', { state, sessionId });
      return oauthState;
    } catch (error) {
      logger.error('Failed to create OAuth state', error);
      throw new Error('Failed to create OAuth state');
    }
  }

  async getState(state: string): Promise<OAuthState | null> {
    try {
      const stateData = await redisClient.get(`${this.STATE_PREFIX}${state}`);
      if (!stateData) {
        logger.debug('OAuth state not found', { state });
        return null;
      }

      const oauthState: OAuthState = JSON.parse(stateData);
      
      // Check if expired
      if (new Date() > new Date(oauthState.expiresAt)) {
        logger.debug('OAuth state expired', { state });
        await this.deleteState(state);
        return null;
      }

      return oauthState;
    } catch (error) {
      logger.error('Failed to get OAuth state', error);
      return null;
    }
  }

  async updateState(state: string, updates: Partial<OAuthState>): Promise<void> {
    try {
      const existingState = await this.getState(state);
      if (!existingState) {
        throw new Error('OAuth state not found');
      }

      const updatedState = { ...existingState, ...updates };
      await redisClient.set(
        `${this.STATE_PREFIX}${state}`,
        JSON.stringify(updatedState),
        this.STATE_TTL
      );

      logger.debug('OAuth state updated', { state });
    } catch (error) {
      logger.error('Failed to update OAuth state', error);
      throw error;
    }
  }

  async deleteState(state: string): Promise<void> {
    try {
      await redisClient.del(`${this.STATE_PREFIX}${state}`);
      logger.debug('OAuth state deleted', { state });
    } catch (error) {
      logger.error('Failed to delete OAuth state', error);
      // Don't throw here as this is cleanup
    }
  }

  private generateState(): string {
    return openidClient.randomState();
  }

  async cleanupExpiredStates(): Promise<number> {
    try {
      const pattern = `${this.STATE_PREFIX}*`;
      const keys = await redisClient.keys(pattern);
      let cleanedCount = 0;

      for (const key of keys) {
        const stateData = await redisClient.get(key);
        if (stateData) {
          try {
            const state: OAuthState = JSON.parse(stateData);
            if (new Date() > new Date(state.expiresAt)) {
              await redisClient.del(key);
              cleanedCount++;
            }
          } catch (parseError) {
            logger.warn('Invalid OAuth state encountered during cleanup', {
              key,
              error: parseError instanceof Error ? parseError.message : String(parseError),
            });
            // Invalid state data, clean it up
            await redisClient.del(key);
            cleanedCount++;
          }
        }
      }

      if (cleanedCount > 0) {
        logger.info(`Cleaned up ${cleanedCount} expired OAuth states`);
      }

      return cleanedCount;
    } catch (error) {
      logger.error('Failed to cleanup expired OAuth states', error);
      return 0;
    }
  }
}
