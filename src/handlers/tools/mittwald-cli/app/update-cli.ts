import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { updateApp, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';
import { logger } from '../../../../utils/logger.js';

interface MittwaldAppUpdateArgs {
  installationId?: string;
  quiet?: boolean;
  description?: string;
  entrypoint?: string;
  documentRoot?: string;
}

function buildUpdates(args: MittwaldAppUpdateArgs): string[] {
  const updates: string[] = [];
  if (args.description) updates.push(`description: ${args.description}`);
  if (args.entrypoint) updates.push(`entrypoint: ${args.entrypoint}`);
  if (args.documentRoot) updates.push(`document root: ${args.documentRoot}`);
  return updates;
}

export const handleAppUpdateCli: MittwaldCliToolHandler<MittwaldAppUpdateArgs> = async (args, sessionId) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  if (!args.installationId) {
    return formatToolResponse('error', 'Installation ID is required. Please provide the installationId parameter.');
  }

  if (!args.description && !args.entrypoint && !args.documentRoot) {
    return formatToolResponse('error', 'At least one update parameter is required (description, entrypoint, or documentRoot).');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  try {
    const result = await updateApp({
      installationId: args.installationId!,
      description: args.description,
      apiToken: session.mittwaldAccessToken,
    });

    return formatToolResponse(
      'success',
      'App updated successfully',
      {
        installationId: args.installationId,
        updates: buildUpdates(args),
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
        : error.message.toLowerCase().includes('not supported')
        ? `Update operation not supported for this app type. Check the app documentation for supported update fields.`
        : error.message;

      return formatToolResponse('error', message, {
        code: error.code,
        details: error.details,
      });
    }

    logger.error('[WP06] Unexpected error in app update handler', { error });
    return formatToolResponse('error', `Failed to update app: ${error instanceof Error ? error.message : String(error)}`);
  }
};
