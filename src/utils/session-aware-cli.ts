import { executeCli, type CliExecuteOptions, type CliExecuteResult } from './cli-wrapper.js';
import { sessionManager, type UserSession } from '../server/session-manager.js';
import { logger } from './logger.js';
import { getContextFlagSupport, type ContextFlagSupport } from './context-flag-support.js';

export class SessionNotFoundError extends Error {
  constructor(sessionId: string) {
    super(`Session not found or expired: ${sessionId}`);
    this.name = 'SessionNotFoundError';
  }
}

export class SessionAuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SessionAuthenticationError';
  }
}

export interface SessionAwareCliOptions extends CliExecuteOptions {
  sessionId?: string;
  validateAccess?: boolean;
}

/**
 * Execute CLI commands with per-user session context and token injection
 * This implements the Redis-based session isolation proposed in docs/OAUTH_MCP_PROPOSAL.md
 */
export class SessionAwareCli {
  
  /**
   * Execute a CLI command with user-specific token and context injection
   * @param command - CLI command (e.g., 'mw')
   * @param args - CLI arguments
   * @param sessionId - User session ID for context isolation
   * @param options - Additional execution options
   * @param toolName - Tool name for context flag filtering (e.g., 'mittwald_app_list')
   */
  async executeWithSession(
    command: string,
    args: string[],
    sessionId: string,
    options: SessionAwareCliOptions = {},
    toolName?: string
  ): Promise<CliExecuteResult> {
    try {
      // Get user session from Redis
      const session = await sessionManager.getSession(sessionId);
      if (!session) {
        throw new SessionNotFoundError(sessionId);
      }

      // Validate session is not expired
      if (session.expiresAt && new Date() > new Date(session.expiresAt)) {
        await sessionManager.destroySession(sessionId);
        throw new SessionNotFoundError(sessionId);
      }

      // Inject user's OAuth token and context into CLI command
      // Only inject context flags that the tool supports (based on its schema)
      const enhancedArgs = this.injectSessionContext(args, session, toolName);
      const enhancedOptions = this.injectSessionToken(options, session);

      logger.debug(`Executing CLI command for session ${sessionId}:`, {
        command,
        args: enhancedArgs,
        userId: session.userId,
        context: session.currentContext
      });

      // Execute CLI with session-specific parameters
      const result = await executeCli(command, enhancedArgs, enhancedOptions);

      // Update session last accessed time
      await sessionManager.updateSession(sessionId, { 
        lastAccessed: new Date() 
      });

      return result;

    } catch (error) {
      logger.error(`Failed to execute CLI command with session ${sessionId}:`, error);
      if (error instanceof SessionNotFoundError) {
        throw error;
      }
      throw new SessionAuthenticationError(
        error instanceof Error ? error.message : String(error)
      );
    }
  }

  /**
   * Inject user's OAuth token into CLI execution environment
   * Uses environment variable approach as per docs/OAUTH_MCP_PROPOSAL.md
   */
  private injectSessionToken(
    options: SessionAwareCliOptions,
    session: UserSession
  ): CliExecuteOptions {
    return {
      ...options,
      token: session.mittwaldAccessToken,
      env: {
        ...options.env,
        MITTWALD_NONINTERACTIVE: '1',
        CI: '1'
      }
    };
  }

  /**
   * Inject user's current context parameters into CLI arguments
   * This prevents context contamination between users.
   *
   * IMPORTANT: Only injects flags that the tool actually supports (based on schema).
   * This fixes the issue where tools like 'app versions' or 'server list' would fail
   * because they don't accept --project-id flag.
   *
   * @param args - CLI arguments
   * @param session - User session with context
   * @param toolName - Tool name to lookup supported flags (e.g., 'mittwald_app_list')
   */
  private injectSessionContext(
    args: string[],
    session: UserSession,
    toolName?: string
  ): string[] {
    const enhancedArgs = [...args];
    const context = session.currentContext;

    // Get flag support for this tool (defaults to no flags if unknown)
    const flagSupport = toolName ? getContextFlagSupport(toolName) : null;

    // Only inject context flags that the tool supports
    if (context.projectId &&
        !this.hasContextParam(args, '--project-id') &&
        (flagSupport?.projectId ?? false)) {
      enhancedArgs.push('--project-id', context.projectId);
    }

    if (context.serverId &&
        !this.hasContextParam(args, '--server-id') &&
        (flagSupport?.serverId ?? false)) {
      enhancedArgs.push('--server-id', context.serverId);
    }

    if (context.orgId &&
        !this.hasContextParam(args, '--org-id') &&
        (flagSupport?.orgId ?? false)) {
      enhancedArgs.push('--org-id', context.orgId);
    }

    return enhancedArgs;
  }

  /**
   * Check if a context parameter is already present in command arguments
   */
  private hasContextParam(args: string[], param: string): boolean {
    return args.includes(param);
  }

  /**
   * Validate that a user has access to a specific resource
   * @param sessionId - User session ID
   * @param resourceType - Type of resource (project, server, org)
   * @param resourceId - ID of the resource
   */
  async validateResourceAccess(
    sessionId: string,
    resourceType: 'project' | 'server' | 'org',
    resourceId: string
  ): Promise<boolean> {
    try {
      const session = await sessionManager.getSession(sessionId);
      if (!session) {
        return false;
      }

      // Use CLI to validate access by attempting to get resource details
      const result = await this.executeWithSession(
        'mw',
        [resourceType, 'get', resourceId, '--output', 'json'],
        sessionId,
        { validateAccess: false } // Prevent infinite recursion
      );

      return result.exitCode === 0;

    } catch (error) {
      logger.warn(`Access validation failed for ${resourceType} ${resourceId}:`, error);
      return false;
    }
  }

  /**
   * Get list of projects accessible to the user
   * @param sessionId - User session ID
   */
  async getAccessibleProjects(sessionId: string): Promise<string[]> {
    try {
      const result = await this.executeWithSession(
        'mw',
        ['project', 'list', '--output', 'json'],
        sessionId
      );

      if (result.exitCode !== 0) {
        throw new SessionAuthenticationError('Mittwald CLI returned a non-zero exit code when listing projects');
      }

      const projects = JSON.parse(result.stdout);
      return Array.isArray(projects) ? projects.map((p: any) => p.id).filter(Boolean) : [];

    } catch (error) {
      logger.error(`Failed to get accessible projects for session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Update user's current context in Redis session
   * @param sessionId - User session ID  
   * @param context - New context to set
   * @param validateAccess - Whether to validate user has access to resources
   */
  async updateUserContext(
    sessionId: string,
    context: UserSession['currentContext'],
    validateAccess: boolean = true
  ): Promise<void> {
    try {
      // Validate user has access to specified resources
      if (validateAccess) {
        if (context.projectId) {
          const hasAccess = await this.validateResourceAccess(sessionId, 'project', context.projectId);
          if (!hasAccess) {
            throw new Error(`Access denied to project: ${context.projectId}`);
          }
        }

        if (context.serverId) {
          const hasAccess = await this.validateResourceAccess(sessionId, 'server', context.serverId);
          if (!hasAccess) {
            throw new Error(`Access denied to server: ${context.serverId}`);
          }
        }

        if (context.orgId) {
          const hasAccess = await this.validateResourceAccess(sessionId, 'org', context.orgId);
          if (!hasAccess) {
            throw new Error(`Access denied to organization: ${context.orgId}`);
          }
        }
      }

      // Update context in Redis session
      await sessionManager.updateContext(sessionId, context);

      logger.info(`Context updated for session ${sessionId}:`, context);

    } catch (error) {
      logger.error(`Failed to update context for session ${sessionId}:`, error);
      throw error;
    }
  }
}

export const sessionAwareCli = new SessionAwareCli();
