import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { logger } from '../../../../../utils/logger.js';
import { invokeCliTool, CliToolError } from '../../../../../tools/index.js';

interface MittwaldUserSshKeyDeleteArgs {
  keyId: string;
  confirm?: boolean;
  force?: boolean;
  quiet?: boolean;
}

function buildCliArgs(args: MittwaldUserSshKeyDeleteArgs): string[] {
  const argv = ['user', 'ssh-key', 'delete', args.keyId];
  if (args.force) argv.push('--force');
  if (args.quiet) argv.push('--quiet');
  return argv;
}

function parseQuietOutput(output: string): string | undefined {
  const trimmed = output.trim();
  if (!trimmed) return undefined;
  const lines = trimmed.split(/\r?\n/);
  return lines.at(-1);
}

function mapCliError(error: CliToolError, args: MittwaldUserSshKeyDeleteArgs): string {
  const stdout = error.stdout ?? '';
  const stderr = error.stderr ?? '';
  const combined = `${stdout}\n${stderr}`.toLowerCase();

  if (combined.includes('not found') || combined.includes('no ssh key found')) {
    return `SSH key not found: ${args.keyId}.\nError: ${stderr || error.message}`;
  }

  const rawMessage = stderr || stdout || error.message;
  return `Failed to delete SSH key: ${rawMessage}`;
}

export const handleUserSshKeyDeleteCli: MittwaldCliToolHandler<MittwaldUserSshKeyDeleteArgs> = async (args, sessionId) => {
  const resolvedSessionId = typeof sessionId === 'string' ? sessionId : (sessionId as any)?.sessionId;
  const resolvedUserId = typeof sessionId === 'string' ? undefined : (sessionId as any)?.userId;
  if (!args.keyId || !args.keyId.trim()) {
    return formatToolResponse('error', 'SSH key ID is required.');
  }

  if (args.confirm !== true) {
    return formatToolResponse(
      'error',
      'SSH key deletion requires confirm=true. This operation is destructive and cannot be undone.'
    );
  }

  logger.warn('[UserSshKeyDelete] Destructive operation attempted', {
    keyId: args.keyId,
    force: Boolean(args.force),
    sessionId: resolvedSessionId,
    ...(resolvedUserId ? { userId: resolvedUserId } : {}),
  });

  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_user_ssh_key_delete',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout ?? '';
    const stderr = result.result.stderr ?? '';
    const output = stdout.trim() || stderr.trim();

    if (args.quiet) {
      const quietMessage = parseQuietOutput(stdout) ?? parseQuietOutput(stderr ?? '') ?? output;
      return formatToolResponse(
        'success',
        quietMessage || `SSH key ${args.keyId} deleted successfully`,
        {
          keyId: args.keyId,
          deleted: true,
        },
        {
          command: result.meta.command,
          durationMs: result.meta.durationMs,
        }
      );
    }

    const message = output || `SSH key ${args.keyId} deleted successfully`;
    return formatToolResponse(
      'success',
      message,
      {
        keyId: args.keyId,
        deleted: true,
        rawOutput: output,
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
