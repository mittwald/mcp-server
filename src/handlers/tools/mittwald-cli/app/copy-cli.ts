import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { copyApp, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';
import { logger } from '../../../../utils/logger.js';

interface MittwaldAppCopyArgs {
  installationId?: string;
  description: string;
  quiet?: boolean;
}

export const handleAppCopyCli: MittwaldCliToolHandler<MittwaldAppCopyArgs> = async (args, sessionId) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  if (!args.installationId) {
    return formatToolResponse(
      'error',
      'Installation ID is required. Please provide the installationId parameter.'
    );
  }

  if (!args.description) {
    return formatToolResponse(
      'error',
      'Description is required. Please provide the description parameter.'
    );
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  try {
    const result = await copyApp({
      installationId: args.installationId!,
      description: args.description,
      apiToken: session.mittwaldAccessToken,
    });

    const copyData = result.data as any;

    return formatToolResponse(
      'success',
      'App copied successfully',
      {
        originalInstallationId: args.installationId,
        newInstallationId: copyData?.id,
        description: args.description,
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

    logger.error('[WP06] Unexpected error in app copy handler', { error });
    return formatToolResponse('error', `Failed to copy app: ${error instanceof Error ? error.message : String(error)}`);
  }
};
