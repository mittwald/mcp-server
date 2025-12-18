import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { logger } from '../../../../utils/logger.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';
import { deleteSshUser, LibraryError } from '@mittwald-mcp/cli-core';
import { validateToolParity } from '../../../../../tests/validation/parallel-validator.js';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';

interface MittwaldSshUserDeleteArgs {
  sshUserId: string;
  confirm?: boolean;
  force?: boolean;
  quiet?: boolean;
}

function buildCliArgs(args: MittwaldSshUserDeleteArgs): string[] {
  const cliArgs: string[] = ['ssh-user', 'delete', args.sshUserId];

  if (args.force) cliArgs.push('--force');
  if (args.quiet) cliArgs.push('--quiet');

  return cliArgs;
}

function parseQuietOutput(output: string): string | undefined {
  const trimmed = output.trim();
  if (!trimmed) return undefined;
  const lines = trimmed.split(/\r?\n/);
  return lines.at(-1);
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

function buildSuccessPayload(stdout: string, args: MittwaldSshUserDeleteArgs, quiet: boolean) {
  return {
    sshUserId: args.sshUserId,
    action: 'deleted',
    ...(quiet
      ? { status: 'success' }
      : { output: stdout }),
  };
}

export const handleSshUserDeleteCli: MittwaldCliToolHandler<MittwaldSshUserDeleteArgs> = async (args, sessionId) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();
  const resolvedSessionId = typeof sessionId === 'string' ? sessionId : (sessionId as any)?.sessionId;
  const resolvedUserId = typeof sessionId === 'string' ? undefined : (sessionId as any)?.userId;

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  if (!args.sshUserId) {
    return formatToolResponse('error', 'SSH user ID is required to delete an SSH user');
  }

  if (args.confirm !== true) {
    return formatToolResponse(
      'error',
      'SSH user deletion requires confirm=true. This operation is destructive and cannot be undone.'
    );
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  logger.warn('[SshUserDelete] Destructive operation attempted', {
    sshUserId: args.sshUserId,
    force: Boolean(args.force),
    sessionId: resolvedSessionId,
    ...(resolvedUserId ? { userId: resolvedUserId } : {}),
  });

  const argv = buildCliArgs(args);

  try {
    // WP04: Parallel validation - run both CLI and library
    const validation = await validateToolParity({
      toolName: 'mittwald_ssh_user_delete',
      cliCommand: 'mw',
      cliArgs: [...argv, '--token', session.mittwaldAccessToken],
      libraryFn: async () => {
        return await deleteSshUser({
          sshUserId: args.sshUserId,
          apiToken: session.mittwaldAccessToken,
        });
      },
      ignoreFields: ['durationMs', 'duration', 'timestamp'],
    });

    // Log validation results
    if (!validation.passed) {
      logger.warn('[WP04 Validation] Output mismatch detected', {
        tool: 'mittwald_ssh_user_delete',
        sshUserId: args.sshUserId,
        discrepancyCount: validation.discrepancies.length,
        discrepancies: validation.discrepancies,
        cliExitCode: validation.cliOutput.exitCode,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
      });
    } else {
      logger.info('[WP04 Validation] 100% parity achieved', {
        tool: 'mittwald_ssh_user_delete',
        sshUserId: args.sshUserId,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
        speedup: `${((validation.cliOutput.durationMs / validation.libraryOutput.durationMs) * 100).toFixed(0)}%`,
      });
    }

    const successPayload = buildSuccessPayload('', args, Boolean(args.quiet));

    return formatToolResponse(
      'success',
      args.quiet ? 'SSH user deleted successfully' : `SSH user ${args.sshUserId} has been successfully deleted`,
      successPayload,
      {
        durationMs: validation.libraryOutput.durationMs,
        validationPassed: validation.passed,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
      }
    );
  } catch (error) {
    if (error instanceof LibraryError) {
      return formatToolResponse('error', error.message, {
        code: error.code,
        details: error.details,
      });
    }

    if (error instanceof CliToolError) {
      const message = mapCliError(error, args);
      return formatToolResponse('error', message, {
        exitCode: error.exitCode,
        stderr: error.stderr,
        stdout: error.stdout,
        suggestedAction: error.suggestedAction,
      });
    }

    logger.error('[WP04] Unexpected error in ssh user delete handler', { error });
    return formatToolResponse('error', `Failed to delete SSH user: ${error instanceof Error ? error.message : String(error)}`);
  }
};
