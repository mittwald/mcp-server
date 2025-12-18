import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { listProjectMemberships, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';
import { logger } from '../../../../utils/logger.js';

export interface MittwaldProjectMembershipListArgs {
  projectId: string;
  output?: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
  extended?: boolean;
  noHeader?: boolean;
  noTruncate?: boolean;
  noRelativeDates?: boolean;
  csvSeparator?: ',' | ';';
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
  };
}

export const handleProjectMembershipListCli: MittwaldCliToolHandler<MittwaldProjectMembershipListArgs> = async (args, sessionId) => {
  if (!args.projectId) {
    return formatToolResponse('error', 'Project ID is required.');
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
    const result = await listProjectMemberships({
      projectId: args.projectId,
      apiToken: session.mittwaldAccessToken,
    });

    const memberships = result.data as any[];

    if (!memberships || memberships.length === 0) {
      return formatToolResponse(
        'success',
        'No project memberships found',
        [],
        {
          durationMs: result.durationMs,
        }
      );
    }

    const formatted = memberships.map((item) => formatMembership((item ?? {}) as Record<string, unknown>));

    return formatToolResponse(
      'success',
      `Found ${formatted.length} project membership(s)`,
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

    logger.error('[WP06] Unexpected error in project membership list handler', { error });
    return formatToolResponse('error', `Failed to list project memberships: ${error instanceof Error ? error.message : String(error)}`);
  }
};
