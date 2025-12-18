import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { getProjectMembership, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';
import { logger } from '../../../../utils/logger.js';

export interface MittwaldProjectMembershipGetArgs {
  membershipId: string;
  output?: 'txt' | 'json' | 'yaml';
}

function formatMembership(record: Record<string, unknown>) {
  const user = (record.user ?? {}) as Record<string, unknown>;
  const person = (user.person ?? {}) as Record<string, unknown>;
  return {
    id: record.id,
    userId: record.userId,
    email: record.email ?? user.email,
    name: record.name ?? user.name ?? person.name,
    role: record.role ?? record.projectRole,
    status: record.status ?? 'active',
    createdAt: record.createdAt,
    expiresAt: record.expiresAt ?? record.membershipExpiresAt ?? 'Never',
    projectId: record.projectId,
    permissions: record.permissions ?? record.projectPermissions,
  };
}

export const handleProjectMembershipGetCli: MittwaldCliToolHandler<MittwaldProjectMembershipGetArgs> = async (args, sessionId) => {
  if (!args.membershipId) {
    return formatToolResponse('error', 'Project membership ID is required.');
  }

  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  try {
    const result = await getProjectMembership({
      membershipId: args.membershipId,
      apiToken: session.mittwaldAccessToken,
    });

    const membership = result.data as Record<string, unknown>;
    const formatted = formatMembership(membership);

    return formatToolResponse(
      'success',
      'Project membership retrieved successfully',
      formatted,
      {
        durationMs: result.durationMs,
      }
    );
  } catch (error) {
    if (error instanceof LibraryError) {
      return formatToolResponse('error', error.message, {
        code: error.code,
        details: error.details,
      });
    }

    logger.error('[WP06] Unexpected error in project membership get handler', { error });
    return formatToolResponse('error', `Failed to get project membership: ${error instanceof Error ? error.message : String(error)}`);
  }
};
