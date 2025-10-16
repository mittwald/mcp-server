import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { sessionAwareCli } from '../../../../utils/session-aware-cli.js';
import { sessionManager, type UserSession } from '../../../../server/session-manager.js';
import { logger } from '../../../../utils/logger.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';

function resolveSessionId(provided?: string | { sessionId?: string }): string | undefined {
  if (!provided) return getCurrentSessionId();
  if (typeof provided === 'string') return provided;
  return provided.sessionId ?? getCurrentSessionId();
}

interface SessionAwareContextGetArgs {
  output?: 'txt' | 'json' | 'yaml';
}

interface SessionAwareContextSetArgs {
  projectId?: string;
  serverId?: string;
  orgId?: string;
  installationId?: string;
  stackId?: string;
}

interface SessionAwareContextResetArgs {
  // No arguments needed for reset
}

/**
 * Get current user context from Redis session (not CLI global context)
 * This implements the session-based context isolation from docs/OAUTH_MCP_PROPOSAL.md
 */
export const handleSessionAwareContextGet: MittwaldCliToolHandler<SessionAwareContextGetArgs> = async (args, sessionId) => {
  try {
    const effectiveSessionId = resolveSessionId(sessionId);

    if (!effectiveSessionId) {
      return formatToolResponse(
        "error",
        "Session ID is required for context operations"
      );
    }

    // Get user session from Redis
    const session = await sessionManager.getSession(effectiveSessionId);
    if (!session) {
      return formatToolResponse(
        "error",
        "Session not found or expired. Please re-authenticate."
      );
    }

    const outputFormat = args.output || 'json';
    const context = session.currentContext;
    const contextCount = Object.keys(context).filter(key => context[key as keyof typeof context]).length;

    // Format output according to requested format
    let formattedOutput: any;
    if (outputFormat === 'json') {
      formattedOutput = context;
    } else if (outputFormat === 'yaml') {
      // Simple YAML formatting
      formattedOutput = Object.entries(context)
        .filter(([_, value]) => value)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n');
    } else {
      // Text format
      formattedOutput = Object.entries(context)
        .filter(([_, value]) => value)
        .map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}`)
        .join('\n') || 'No context parameters set';
    }

    const message = contextCount > 0 
      ? `Found ${contextCount} context parameter(s) in session`
      : 'No context parameters set in session';

    return formatToolResponse(
      "success",
      message,
      {
        context,
        formattedOutput,
        format: outputFormat,
        sessionId: effectiveSessionId,
        userId: session.userId,
        lastAccessed: session.lastAccessed
      }
    );

  } catch (error) {
    logger.error('Failed to get session context:', error);
    return formatToolResponse(
      "error",
      `Failed to get context: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};

/**
 * Set user context in Redis session (not CLI global context)
 * Validates user access to specified resources before updating context
 */
export const handleSessionAwareContextSet: MittwaldCliToolHandler<SessionAwareContextSetArgs> = async (args, sessionId) => {
  try {
    const effectiveSessionId = resolveSessionId(sessionId);

    if (!effectiveSessionId) {
      return formatToolResponse(
        "error",
        "Session ID is required for context operations"
      );
    }

    // Get current session
    const session = await sessionManager.getSession(effectiveSessionId);
    if (!session) {
      return formatToolResponse(
        "error",
        "Session not found or expired. Please re-authenticate."
      );
    }

    // Build new context from provided arguments
    const newContext: UserSession['currentContext'] = { ...session.currentContext };
    const setParameters: Array<{ key: string; value: string }> = [];

    if (args.projectId) {
      newContext.projectId = args.projectId;
      setParameters.push({ key: 'project-id', value: args.projectId });
    }

    if (args.serverId) {
      newContext.serverId = args.serverId;
      setParameters.push({ key: 'server-id', value: args.serverId });
    }

    if (args.orgId) {
      newContext.orgId = args.orgId;
      setParameters.push({ key: 'org-id', value: args.orgId });
    }

    // Note: installationId and stackId would need to be added to UserSession interface
    // For now, we'll ignore them as they're not in the current session structure

    if (setParameters.length === 0) {
      return formatToolResponse(
        "error",
        "At least one parameter must be provided to set context"
      );
    }

    // Update context in Redis with access validation
    await sessionAwareCli.updateUserContext(effectiveSessionId, newContext, true);

    const parametersList = setParameters
      .map(param => `${param.key}: ${param.value}`)
      .join(', ');

    return formatToolResponse(
      "success",
      `Context parameters set in session: ${parametersList}`,
      {
        message: 'Context parameters set successfully in user session',
        parameters: Object.fromEntries(setParameters.map(p => [p.key, p.value])),
        newContext,
        sessionId: effectiveSessionId,
        timestamp: new Date().toISOString()
      }
    );

  } catch (error) {
    logger.error('Failed to set session context:', error);
    
    // Handle specific error cases
    if (error instanceof Error && error.message.includes('Access denied')) {
      return formatToolResponse(
        "error",
        `Access denied: ${error.message}`
      );
    }

    return formatToolResponse(
      "error",
      `Failed to set context: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};

/**
 * Reset user context in Redis session (clear all context parameters)
 */
export const handleSessionAwareContextReset: MittwaldCliToolHandler<SessionAwareContextResetArgs> = async (args, sessionId) => {
  try {
    const effectiveSessionId = resolveSessionId(sessionId);

    if (!effectiveSessionId) {
      return formatToolResponse(
        "error",
        "Session ID is required for context operations"
      );
    }

    // Get current session
    const session = await sessionManager.getSession(effectiveSessionId);
    if (!session) {
      return formatToolResponse(
        "error",
        "Session not found or expired. Please re-authenticate."
      );
    }

    // Reset context to empty
    const emptyContext: UserSession['currentContext'] = {};
    await sessionAwareCli.updateUserContext(effectiveSessionId, emptyContext, false);

    return formatToolResponse(
      "success",
      "All context parameters cleared from session",
      {
        message: 'Session context reset successfully',
        previousContext: session.currentContext,
        newContext: emptyContext,
        sessionId: effectiveSessionId,
        timestamp: new Date().toISOString()
      }
    );

  } catch (error) {
    logger.error('Failed to reset session context:', error);
    return formatToolResponse(
      "error",
      `Failed to reset context: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};

/**
 * Get list of projects accessible to the current user session
 */
export const handleGetAccessibleProjects: MittwaldCliToolHandler<{}> = async (args, sessionId) => {
  try {
    const effectiveSessionId = resolveSessionId(sessionId);

    if (!effectiveSessionId) {
      return formatToolResponse(
        "error",
        "Session ID is required for this operation"
      );
    }

    const session = await sessionManager.getSession(effectiveSessionId);
    if (!session) {
      return formatToolResponse(
        "error",
        "Session not found or expired. Please re-authenticate."
      );
    }

    const projects = await sessionAwareCli.getAccessibleProjects(effectiveSessionId);

    return formatToolResponse(
      "success",
      `Found ${projects.length} accessible projects`,
      {
        projects,
        sessionId: effectiveSessionId,
        userId: session.userId,
        count: projects.length
      }
    );

  } catch (error) {
    logger.error('Failed to get accessible projects:', error);
    return formatToolResponse(
      "error",
      `Failed to get accessible projects: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
