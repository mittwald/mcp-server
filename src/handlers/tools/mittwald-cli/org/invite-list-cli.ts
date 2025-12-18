import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { listOrgInvites, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';
import { logger } from '../../../../utils/logger.js';

export interface MittwaldOrgInviteListArgs {
  orgId?: string;
  output?: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
  extended?: boolean;
  noHeader?: boolean;
  noTruncate?: boolean;
  noRelativeDates?: boolean;
  csvSeparator?: ',' | ';';
}

function resolveOrgId(args: MittwaldOrgInviteListArgs, context: unknown): string | undefined {
  return args.orgId || (context as { orgId?: string } | undefined)?.orgId;
}

export const handleOrgInviteListCli: MittwaldToolHandler<MittwaldOrgInviteListArgs> = async (args, context) => {
  const orgId = resolveOrgId(args, context.orgContext);
  if (!orgId) {
    return formatToolResponse('error', 'Organization ID is required. Either provide it as a parameter or set a default org in the context.');
  }

  const effectiveSessionId = context?.sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  try {
    const result = await listOrgInvites({
      customerId: orgId,
      apiToken: session.mittwaldAccessToken,
    });

    const data = result.data as any[];
    const count = Array.isArray(data) ? data.length : 0;

    return formatToolResponse(
      'success',
      `Found ${count} organization invite(s)`,
      data,
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

    logger.error('[WP06] Unexpected error in org invite list handler', { error });
    return formatToolResponse('error', `Failed to list organization invites: ${error instanceof Error ? error.message : String(error)}`);
  }
};
