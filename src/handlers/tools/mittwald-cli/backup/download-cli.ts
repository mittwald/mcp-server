import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { getBackupDownloadUrl, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';
import { logger } from '../../../../utils/logger.js';

interface MittwaldBackupDownloadCliArgs {
  backupId?: string;
  format?: 'tar' | 'zip';
  password?: string;
  recreate?: boolean;
}

export const handleBackupDownloadCli: MittwaldCliToolHandler<MittwaldBackupDownloadCliArgs> = async (
  args,
  sessionId
) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  if (!args.backupId) {
    return formatToolResponse('error', 'Backup ID is required. Please provide the backupId parameter.');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  try {
    const result = await getBackupDownloadUrl({
      backupId: args.backupId,
      format: args.format,
      password: args.password,
      recreate: args.recreate,
      apiToken: session.mittwaldAccessToken,
    });

    const info = result.data;

    if (!info.downloadURL) {
      return formatToolResponse(
        'success',
        `Backup export is being prepared (phase: ${info.phase ?? 'Pending'}). No download URL available yet.`,
        {
          ...info,
          instructions:
            'The archive is still being created. Call mittwald_backup_download again in a few seconds ' +
            'to obtain the download URL once the export has completed.',
        },
        { durationMs: result.durationMs }
      );
    }

    const downloadCommand = `curl -L -o backup-${args.backupId}.${info.format ?? 'tar'} '${info.downloadURL}'`;

    return formatToolResponse(
      'success',
      `Download URL for backup ${args.backupId}`,
      {
        ...info,
        downloadCommand,
        instructions:
          'Download the archive on your own machine; this MCP server does not transfer files.\n\n' +
          `${downloadCommand}\n\n` +
          (info.expiresAt ? `The URL expires at ${info.expiresAt}.\n` : '') +
          (info.withPassword ? 'The archive is password-protected with the password used at export time.\n' : '') +
          (info.sha256Checksum ? `Expected SHA-256 checksum: ${info.sha256Checksum}` : ''),
      },
      { durationMs: result.durationMs }
    );
  } catch (error) {
    if (error instanceof LibraryError) {
      return formatToolResponse('error', error.message, {
        code: error.code,
        details: error.details,
      });
    }

    logger.error('Unexpected error in backup download handler', { error });
    return formatToolResponse(
      'error',
      `Failed to resolve backup download URL: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
