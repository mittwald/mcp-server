import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { createBackup, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';
import { logger } from '../../../../utils/logger.js';

interface MittwaldBackupCreateCliArgs {
  projectId?: string;
  expires: string;
  description?: string;
  quiet?: boolean;
  wait?: boolean;
  waitTimeout?: string;
}

export const handleBackupCreateCli: MittwaldCliToolHandler<MittwaldBackupCreateCliArgs> = async (args, sessionId) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  if (!args.projectId) {
    return formatToolResponse('error', 'projectId is required');
  }

  if (!args.expires) {
    return formatToolResponse('error', "'expires' is required. Please provide the expires parameter.");
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  try {
    const result = await createBackup({
      projectId: args.projectId!,
      description: args.description,
      apiToken: session.mittwaldAccessToken,
    });

    const backup = result.data as any;

    const message = args.wait ? 'Backup created successfully' : 'Backup creation initiated';

    return formatToolResponse(
      'success',
      message,
      {
        backupId: backup?.id,
        projectId: args.projectId,
        expires: args.expires,
        description: args.description,
        wait: args.wait,
      },
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

    logger.error('[WP06] Unexpected error in backup create handler', { error });
    return formatToolResponse('error', `Failed to create backup: ${error instanceof Error ? error.message : String(error)}`);
  }
};
