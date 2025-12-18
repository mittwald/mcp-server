import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { logger } from '../../../../utils/logger.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';
import { deleteSftpUser, LibraryError } from '@mittwald-mcp/cli-core';
import { validateToolParity } from '../../../../../tests/validation/parallel-validator.js';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';

interface MittwaldSftpUserDeleteArgs {
  sftpUserId: string;
  confirm?: boolean;
  force?: boolean;
  quiet?: boolean;
}

function buildCliArgs(args: MittwaldSftpUserDeleteArgs): string[] {
  const cliArgs: string[] = ['sftp-user', 'delete', args.sftpUserId];
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

  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  const resolvedUserId = typeof sessionId === 'string' ? undefined : (sessionId as any)?.userId;

  logger.warn('[SftpUserDelete] Destructive operation attempted', {
    sftpUserId: args.sftpUserId,
    force: Boolean(args.force),
    sessionId: effectiveSessionId,
    ...(resolvedUserId ? { userId: resolvedUserId } : {}),
  });

  const argv = buildCliArgs(args);

  try {
    // WP05: Parallel validation - run both CLI and library
    const validation = await validateToolParity({
      toolName: 'mittwald_sftp_user_delete',
      cliCommand: 'mw',
      cliArgs: [...argv, '--token', session.mittwaldAccessToken],
      libraryFn: async () => {
        return await deleteSftpUser({
          sftpUserId: args.sftpUserId,
          apiToken: session.mittwaldAccessToken,
        });
      },
      ignoreFields: ['durationMs', 'duration', 'timestamp'],
    });

    // Log validation results
    if (!validation.passed) {
      logger.warn('[WP05 Validation] Output mismatch detected', {
        tool: 'mittwald_sftp_user_delete',
        sftpUserId: args.sftpUserId,
        discrepancyCount: validation.discrepancies.length,
        discrepancies: validation.discrepancies,
        cliExitCode: validation.cliOutput.exitCode,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
      });
    } else {
      logger.info('[WP05 Validation] 100% parity achieved', {
        tool: 'mittwald_sftp_user_delete',
        sftpUserId: args.sftpUserId,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
        speedup: `${((validation.cliOutput.durationMs / validation.libraryOutput.durationMs) * 100).toFixed(0)}%`,
      });
    }

    // Use library result (void for delete operations)
    if (args.quiet) {
      const quietOutput = args.sftpUserId; // For quiet mode, just return the ID
      return formatToolResponse(
        'success',
        quietOutput,
        {
          sftpUserId: args.sftpUserId,
          action: 'deleted',
          status: 'success',
        },
        {
          durationMs: validation.libraryOutput.durationMs,
          validationPassed: validation.passed,
          cliDuration: validation.cliOutput.durationMs,
          libraryDuration: validation.libraryOutput.durationMs,
        }
      );
    }

    return formatToolResponse(
      'success',
      `SFTP user ${args.sftpUserId} has been successfully deleted`,
      {
        sftpUserId: args.sftpUserId,
        action: 'deleted',
      },
      {
        durationMs: validation.libraryOutput.durationMs,
        validationPassed: validation.passed,
        discrepancyCount: validation.discrepancies.length,
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

    logger.error('[WP05] Unexpected error in sftp user delete handler', { error });
    return formatToolResponse('error', `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`);
  }
};
