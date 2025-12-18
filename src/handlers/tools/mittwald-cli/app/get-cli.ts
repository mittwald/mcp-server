import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { getApp, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';
import { logger } from '../../../../utils/logger.js';

interface MittwaldAppGetArgs {
  installationId?: string;
  output?: 'txt' | 'json' | 'yaml';
}

export const handleAppGetCli: MittwaldCliToolHandler<MittwaldAppGetArgs> = async (args, sessionId) => {
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
    const result = await getApp({
      installationId: args.installationId!,
      apiToken: session.mittwaldAccessToken,
    });

    const appData = result.data as any;

    return formatToolResponse(
      'success',
      `App installation details retrieved for: ${appData.app?.name || appData.appId}`,
      appData,
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

    logger.error('[WP06] Unexpected error in app get handler', { error });
    return formatToolResponse('error', `Failed to get app: ${error instanceof Error ? error.message : String(error)}`);
  }
};
