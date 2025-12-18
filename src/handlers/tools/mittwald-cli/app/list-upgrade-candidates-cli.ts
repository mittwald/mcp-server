import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { listUpgradeCandidates, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';
import { logger } from '../../../../utils/logger.js';

interface MittwaldAppListUpgradeCandidatesArgs {
  installationId?: string;
  output?: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
  extended?: boolean;
  noHeader?: boolean;
  noTruncate?: boolean;
  noRelativeDates?: boolean;
  csvSeparator?: ',' | ';';
}

export const handleAppListUpgradeCandidatesCli: MittwaldCliToolHandler<MittwaldAppListUpgradeCandidatesArgs> = async (args, sessionId) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  if (!args.installationId) {
    return formatToolResponse('error', 'Installation ID is required. Please provide the installationId parameter.');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  try {
    const result = await listUpgradeCandidates({
      installationId: args.installationId!,
      apiToken: session.mittwaldAccessToken,
    });

    const candidates = result.data as any[];

    if (!candidates || candidates.length === 0) {
      return formatToolResponse(
        'success',
        'No upgrade candidates available',
        [],
        {
          durationMs: result.durationMs,
        }
      );
    }

    return formatToolResponse(
      'success',
      `Found ${candidates.length} upgrade candidate(s)`,
      candidates,
      {
        durationMs: result.durationMs,
      }
    );
  } catch (error) {
    if (error instanceof LibraryError) {
      const message = error.message.toLowerCase().includes('not found')
        ? `App installation not found. Please verify the installation ID: ${args.installationId}.`
        : error.message;

      return formatToolResponse('error', message, {
        code: error.code,
        details: error.details,
      });
    }

    logger.error('[WP06] Unexpected error in app list upgrade candidates handler', { error });
    return formatToolResponse('error', `Failed to list upgrade candidates: ${error instanceof Error ? error.message : String(error)}`);
  }
};
