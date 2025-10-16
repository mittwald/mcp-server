import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { logger } from '../../../../../utils/logger.js';
import { invokeCliTool, CliToolError } from '@/tools/index.js';

interface MittwaldDatabaseMysqlUserDeleteArgs {
  userId: string;
  confirm?: boolean;
  force?: boolean;
}

function buildCliArgs(args: MittwaldDatabaseMysqlUserDeleteArgs): string[] {
  const cliArgs: string[] = ['database', 'mysql', 'user', 'delete', args.userId];

  if (args.force) {
    cliArgs.push('--force');
  }

  return cliArgs;
}

function mapCliError(error: CliToolError, args: MittwaldDatabaseMysqlUserDeleteArgs): string {
  const combined = `${error.stderr ?? ''}\n${error.stdout ?? ''}`.toLowerCase();
  const message = error.stderr || error.stdout || error.message;

  if (combined.includes('permission denied') || combined.includes('forbidden') || combined.includes('401')) {
    return `Permission denied while deleting MySQL user. Re-authenticate and ensure the Mittwald CLI session is valid.\nError: ${message}`;
  }

  if (combined.includes('not found') || combined.includes('404')) {
    return `MySQL user not found. Verify the user ID: ${args.userId}.\nError: ${message}`;
  }

  if (combined.includes('main mysql user')) {
    return 'The primary MySQL user cannot be deleted manually. Delete the database to remove its main user.';
  }

  if (combined.includes('cancelled') || combined.includes('confirmation')) {
    return `MySQL user deletion was cancelled. Pass force=true to skip confirmation.\nError: ${message}`;
  }

  return `Failed to delete MySQL user: ${message}`;
}

/**
 * Handle MySQL user deletion through the Mittwald CLI wrapper.
 */
export const handleDatabaseMysqlUserDeleteCli: MittwaldCliToolHandler<MittwaldDatabaseMysqlUserDeleteArgs> = async (
  args,
  context,
) => {
  const resolvedSessionId = typeof context === 'string' ? context : (context as any)?.sessionId;
  const resolvedUserId = typeof context === 'string' ? undefined : (context as any)?.userId;
  if (!args.userId) {
    return formatToolResponse('error', 'User ID is required to delete a MySQL user.');
  }

  if (args.confirm !== true) {
    return formatToolResponse(
      'error',
      'MySQL user deletion requires confirm=true. This operation is destructive and cannot be undone.'
    );
  }

  logger.warn('[DatabaseMysqlUserDelete] Destructive operation attempted', {
    mysqlUserId: args.userId,
    force: Boolean(args.force),
    sessionId: resolvedSessionId,
    ...(resolvedUserId ? { userId: resolvedUserId } : {}),
  });

  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_database_mysql_user_delete',
      argv,
      sessionId: resolvedSessionId,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout ?? '';
    const stderr = result.result.stderr ?? '';

    return formatToolResponse(
      'success',
      `Successfully deleted MySQL user ${args.userId}.`,
      {
        userId: args.userId,
        deleted: true,
        output: stdout || stderr || undefined,
      },
      {
        command: result.meta.command,
        durationMs: result.meta.durationMs,
      }
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

    return formatToolResponse(
      'error',
      `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
