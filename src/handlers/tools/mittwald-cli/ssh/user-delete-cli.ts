import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { logger } from '../../../../utils/logger.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';

interface MittwaldSshUserDeleteArgs {
  sshUserId: string;
  confirm?: boolean;
  force?: boolean;
}

function buildCliArgs(args: MittwaldSshUserDeleteArgs): string[] {
  const cliArgs: string[] = ['ssh-user', 'delete', args.sshUserId];

  if (args.force) cliArgs.push('--force');

  return cliArgs;
}


function mapCliError(error: CliToolError, args: MittwaldSshUserDeleteArgs): string {
  const stderr = error.stderr ?? '';
  const stdout = error.stdout ?? '';
  const combined = `${stderr}\n${stdout}\n${error.message}`.toLowerCase();

  if (combined.includes('403') || combined.includes('forbidden') || combined.includes('permission denied')) {
    const details = stderr || stdout || error.message;
    return `Permission denied when deleting SSH user. Complete OAuth sign-in and ensure the Mittwald CLI is authenticated.\nError: ${details}`;
  }

  if (combined.includes('not found') && combined.includes('ssh user')) {
    const details = stderr || stdout || error.message;
    return `SSH user not found. Please verify the SSH user ID: ${args.sshUserId}.\nError: ${details}`;
  }

  if (combined.includes('confirmation')) {
    const details = stderr || stdout || error.message;
    return `Deletion requires confirmation. Use 'force: true' to confirm deletion.\nError: ${details}`;
  }

  const details = stderr || stdout || error.message;
  return `Failed to delete SSH user: ${details}`;
}

function buildSuccessPayload(stdout: string, args: MittwaldSshUserDeleteArgs) {
  return {
    sshUserId: args.sshUserId,
    action: 'deleted',
    output: stdout,
  };
}

export const handleSshUserDeleteCli: MittwaldCliToolHandler<MittwaldSshUserDeleteArgs> = async (args, sessionId) => {
  const resolvedSessionId = typeof sessionId === 'string' ? sessionId : (sessionId as any)?.sessionId;
  const resolvedUserId = typeof sessionId === 'string' ? undefined : (sessionId as any)?.userId;
  if (!args.sshUserId) {
    return formatToolResponse('error', 'SSH user ID is required to delete an SSH user');
  }

  if (args.confirm !== true) {
    return formatToolResponse(
      'error',
      'SSH user deletion requires confirm=true. This operation is destructive and cannot be undone.'
    );
  }

  logger.warn('[SshUserDelete] Destructive operation attempted', {
    sshUserId: args.sshUserId,
    force: Boolean(args.force),
    sessionId: resolvedSessionId,
    ...(resolvedUserId ? { userId: resolvedUserId } : {}),
  });

  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_ssh_user_delete',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr ?? '' }),
    });

    const meta = {
      command: result.meta.command,
      durationMs: result.meta.durationMs,
    };

    const stdout = result.result.stdout ?? '';

    return formatToolResponse(
      'success',
      `SSH user ${args.sshUserId} has been successfully deleted`,
      buildSuccessPayload(stdout, args),
      meta
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
