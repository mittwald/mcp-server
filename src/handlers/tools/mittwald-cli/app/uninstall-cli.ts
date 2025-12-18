import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { uninstallApp, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';
import { logger } from '../../../../utils/logger.js';

interface MittwaldAppUninstallArgs {
  installationId?: string;
  quiet?: boolean;
  force?: boolean;
}

export const handleAppUninstallCli: MittwaldCliToolHandler<MittwaldAppUninstallArgs> = async (args, sessionId) => {
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
    const result = await uninstallApp({
      installationId: args.installationId!,
      apiToken: session.mittwaldAccessToken,
    });

    return formatToolResponse(
      'success',
      'App uninstalled successfully',
      {
        installationId: args.installationId,
        force: args.force,
        quiet: args.quiet,
      },
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

    logger.error('[WP06] Unexpected error in app uninstall handler', { error });
    return formatToolResponse('error', `Failed to uninstall app: ${error instanceof Error ? error.message : String(error)}`);
  }
};
