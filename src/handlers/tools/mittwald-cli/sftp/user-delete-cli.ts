import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { logger } from '../../../../utils/logger.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';

interface MittwaldSftpUserDeleteArgs {
  sftpUserId: string;
  confirm?: boolean;
  force?: boolean;
}

function buildCliArgs(args: MittwaldSftpUserDeleteArgs): string[] {
  const cliArgs: string[] = ['sftp-user', 'delete', args.sftpUserId];
  if (args.force) cliArgs.push('--force');
  return cliArgs;
}


function mapCliError(error: CliToolError, args: MittwaldSftpUserDeleteArgs): string {
  const stderr = error.stderr ?? '';
  const stdout = error.stdout ?? '';
  const combined = `${stderr}\n${stdout}\n${error.message}`.toLowerCase();

  if (combined.includes('forbidden') || combined.includes('permission denied') || combined.includes('403')) {
    const details = stderr || stdout || error.message;
    return `Permission denied when deleting SFTP user. Complete OAuth sign-in and ensure the Mittwald CLI is authenticated.\nError: ${details}`;
  }

  if (combined.includes('not found') && combined.includes('sftp user')) {
    const details = stderr || stdout || error.message;
    return `SFTP user not found. Please verify the SFTP user ID: ${args.sftpUserId}.\nError: ${details}`;
  }

  if (combined.includes('confirmation')) {
    const details = stderr || stdout || error.message;
    return `Deletion requires confirmation. Use 'force: true' to confirm deletion.\nError: ${details}`;
  }

  const details = stderr || stdout || error.message;
  return `Failed to delete SFTP user: ${details}`;
}

export const handleSftpUserDeleteCli: MittwaldCliToolHandler<MittwaldSftpUserDeleteArgs> = async (args, sessionId) => {
  try {
    if (!args.sftpUserId) {
      return formatToolResponse(
        "error",
        "SFTP user ID is required to delete an SFTP user"
      );
    }

    if (args.confirm !== true) {
      return formatToolResponse(
        'error',
        'SFTP user deletion requires confirm=true. This operation is destructive and cannot be undone.'
      );
    }

    const resolvedSessionId = typeof sessionId === 'string' ? sessionId : (sessionId as any)?.sessionId;
    const resolvedUserId = typeof sessionId === 'string' ? undefined : (sessionId as any)?.userId;

    logger.warn('[SftpUserDelete] Destructive operation attempted', {
      sftpUserId: args.sftpUserId,
      force: Boolean(args.force),
      sessionId: resolvedSessionId,
      ...(resolvedUserId ? { userId: resolvedUserId } : {}),
    });

    const argv = buildCliArgs(args);

    const result = await invokeCliTool({
      toolName: 'mittwald_sftp_user_delete',
      argv,
      parser: (stdout) => stdout,
    });

    const commandMeta = {
      command: result.meta.command,
      durationMs: result.meta.durationMs,
    };

    const stdout = result.result ?? '';

    return formatToolResponse(
      'success',
      `SFTP user ${args.sftpUserId} has been successfully deleted`,
      {
        sftpUserId: args.sftpUserId,
        action: 'deleted',
        output: stdout,
      },
      commandMeta
    );
  } catch (error) {
    if (error instanceof CliToolError) {
      const message = mapCliError(error, args);
      return formatToolResponse('error', message, {
        exitCode: error.exitCode,
        stderr: error.stderr,
        stdout: error.stdout,
        suggestedAction: error.suggestedAction,
      });
    }

    return formatToolResponse('error', `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`);
  }
};
