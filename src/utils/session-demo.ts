/**
 * Demo utility to test session-aware context management
 * This demonstrates the Redis-based session isolation from docs/OAUTH_MCP_PROPOSAL.md
 */

import { sessionManager, type UserSession } from '../server/session-manager.js';
import { sessionAwareCli } from './session-aware-cli.js';
import { logger } from './logger.js';

export class SessionDemo {
  
  /**
   * Create a mock user session for testing
   */
  async createMockSession(userId: string, oauthToken?: string): Promise<string> {
    try {
      const mockSessionData: Omit<UserSession, 'sessionId' | 'lastAccessed'> = {
        userId,
        oauthAccessToken: oauthToken || 'mock-oauth-token',
        refreshToken: 'mock-refresh-token',
        expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 hours from now
        currentContext: {},
        accessibleProjects: [],
        scopes: ['api_read', 'api_write']
      };

      const sessionId = await sessionManager.createSession(
        userId,
        mockSessionData,
        { ttlSeconds: 8 * 60 * 60 } // 8 hours
      );

      logger.info(`Mock session created for user ${userId}: ${sessionId}`);
      return sessionId;

    } catch (error) {
      logger.error('Failed to create mock session:', error);
      throw error;
    }
  }

  /**
   * Demo: Set context for a user session
   */
  async demoSetContext(sessionId: string, projectId?: string, serverId?: string, orgId?: string): Promise<void> {
    try {
      logger.info(`Demo: Setting context for session ${sessionId}`);
      
      const context: UserSession['currentContext'] = {};
      if (projectId) context.projectId = projectId;
      if (serverId) context.serverId = serverId;
      if (orgId) context.orgId = orgId;

      await sessionAwareCli.updateUserContext(sessionId, context, false); // Skip validation for demo
      
      logger.info('Context set successfully:', context);
    } catch (error) {
      logger.error('Failed to set demo context:', error);
      throw error;
    }
  }

  /**
   * Demo: Get context from a user session
   */
  async demoGetContext(sessionId: string): Promise<UserSession['currentContext'] | null> {
    try {
      logger.info(`Demo: Getting context for session ${sessionId}`);
      
      const session = await sessionManager.getSession(sessionId);
      if (!session) {
        logger.warn('Session not found');
        return null;
      }

      logger.info('Current context:', session.currentContext);
      return session.currentContext;
    } catch (error) {
      logger.error('Failed to get demo context:', error);
      throw error;
    }
  }

  /**
   * Demo: Execute CLI command with session context
   */
  async demoExecuteCliCommand(sessionId: string, command: string, args: string[]): Promise<void> {
    try {
      logger.info(`Demo: Executing CLI command with session ${sessionId}: ${command} ${args.join(' ')}`);
      
      const result = await sessionAwareCli.executeWithSession(command, args, sessionId);
      
      logger.info('CLI command result:', {
        exitCode: result.exitCode,
        stdout: result.stdout.substring(0, 200) + (result.stdout.length > 200 ? '...' : ''),
        stderr: result.stderr || 'none'
      });
    } catch (error) {
      logger.error('Failed to execute demo CLI command:', error);
      throw error;
    }
  }

  /**
   * Demo: Multi-user session isolation
   */
  async demoMultiUserIsolation(): Promise<void> {
    try {
      logger.info('Demo: Testing multi-user session isolation');

      // Create sessions for two different users
      const session1 = await this.createMockSession('user1');
      const session2 = await this.createMockSession('user2');

      // Set different contexts for each user
      await this.demoSetContext(session1, 'project-user1', undefined, 'org1');
      await this.demoSetContext(session2, 'project-user2', 'server-user2', undefined);

      // Verify isolation
      const context1 = await this.demoGetContext(session1);
      const context2 = await this.demoGetContext(session2);

      logger.info('User 1 context:', context1);
      logger.info('User 2 context:', context2);

      // Verify contexts are different and isolated
      if (context1?.projectId !== context2?.projectId) {
        logger.info('✅ Session isolation verified: Different users have different contexts');
      } else {
        logger.error('❌ Session isolation failed: Users have same context');
      }

      // Cleanup
      await sessionManager.destroySession(session1);
      await sessionManager.destroySession(session2);
      
      logger.info('Demo completed successfully');
    } catch (error) {
      logger.error('Multi-user isolation demo failed:', error);
      throw error;
    }
  }

  /**
   * Demo: Session expiration and cleanup
   */
  async demoSessionExpiration(): Promise<void> {
    try {
      logger.info('Demo: Testing session expiration');

      // Create a session with short TTL (10 seconds)
      const shortLivedSession = await sessionManager.createSession(
        'temp-user',
        {
          userId: 'temp-user',
          oauthAccessToken: 'temp-token',
          expiresAt: new Date(Date.now() + 10000), // 10 seconds
          currentContext: { projectId: 'temp-project' }
        },
        { ttlSeconds: 10 }
      );

      logger.info(`Short-lived session created: ${shortLivedSession}`);

      // Verify session exists
      const session = await sessionManager.getSession(shortLivedSession);
      if (session) {
        logger.info('Session found:', session.currentContext);
      }

      // Wait for expiration (in a real scenario, this would be handled by TTL)
      logger.info('Waiting for session expiration...');
      await new Promise(resolve => setTimeout(resolve, 11000));

      // Try to access expired session
      const expiredSession = await sessionManager.getSession(shortLivedSession);
      if (!expiredSession) {
        logger.info('✅ Session expiration verified: Session automatically cleaned up');
      } else {
        logger.warn('⚠️ Session still exists after expiration time');
      }

    } catch (error) {
      logger.error('Session expiration demo failed:', error);
      throw error;
    }
  }
}

export const sessionDemo = new SessionDemo();
