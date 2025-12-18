import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { logger } from '../../../../../utils/logger.js';
import { invokeCliTool, CliToolError } from '../../../../../tools/index.js';
import { deleteUserSshKey, LibraryError } from '@mittwald-mcp/cli-core';
import { validateToolParity } from '../../../../../../tests/validation/parallel-validator.js';
import { sessionManager } from '../../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../../utils/execution-context.js';

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

function buildSuccessPayload(
  args: MittwaldUserSshKeyDeleteArgs,
  output: string,
): Record<string, unknown> {
  return {
    keyId: args.keyId,
    deleted: true,
    output,
    force: args.force,
    quiet: args.quiet,
  };
}

export const handleUserSshKeyDeleteCli: MittwaldCliToolHandler<MittwaldUserSshKeyDeleteArgs> = async (args, sessionId) => {
  if (!args.keyId || !args.keyId.trim()) {
    return formatToolResponse('error', 'SSH key ID is required.');
  }

  if (args.confirm !== true) {
    return formatToolResponse(
      'error',
      'SSH key deletion requires confirm=true. This operation is destructive and cannot be undone.'
    );
  }

  const effectiveSessionId = sessionId || getCurrentSessionId();
  const resolvedSessionId = typeof sessionId === 'string' ? sessionId : (sessionId as any)?.sessionId;
  const resolvedUserId = typeof sessionId === 'string' ? undefined : (sessionId as any)?.userId;

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  logger.warn('[UserSshKeyDelete] Destructive operation attempted', {
    keyId: args.keyId,
    force: Boolean(args.force),
    quiet: Boolean(args.quiet),
    sessionId: resolvedSessionId,
    ...(resolvedUserId ? { userId: resolvedUserId } : {}),
  });

  const argv = buildCliArgs(args);

  try {
    // WP05: Parallel validation - run both CLI and library
    const validation = await validateToolParity({
      toolName: 'mittwald_user_ssh_key_delete',
      cliCommand: 'mw',
      cliArgs: [...argv, '--token', session.mittwaldAccessToken],
      libraryFn: async () => {
        return await deleteUserSshKey({
          sshKeyId: args.keyId,
          apiToken: session.mittwaldAccessToken,
        });
      },
      ignoreFields: ['durationMs', 'duration', 'timestamp'],
    });

    // Log validation results
    if (!validation.passed) {
      logger.warn('[WP05 Validation] Output mismatch detected', {
        tool: 'mittwald_user_ssh_key_delete',
        keyId: args.keyId,
        discrepancyCount: validation.discrepancies.length,
        discrepancies: validation.discrepancies,
        cliExitCode: validation.cliOutput.exitCode,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
      });
    } else {
      logger.info('[WP05 Validation] 100% parity achieved', {
        tool: 'mittwald_user_ssh_key_delete',
        keyId: args.keyId,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
        speedup: `${((validation.cliOutput.durationMs / validation.libraryOutput.durationMs) * 100).toFixed(0)}%`,
      });
    }

    const output = `SSH key ${args.keyId} deleted successfully`;

    if (args.quiet) {
      const quietOutput = output;
      return formatToolResponse(
        'success',
        quietOutput || 'SSH key deleted successfully',
        buildSuccessPayload(args, quietOutput),
        {
          durationMs: validation.libraryOutput.durationMs,
          validationPassed: validation.passed,
          discrepancyCount: validation.discrepancies.length,
          cliDuration: validation.cliOutput.durationMs,
          libraryDuration: validation.libraryOutput.durationMs,
        }
      );
    }

    return formatToolResponse(
      'success',
      output || `SSH key ${args.keyId} deleted successfully`,
      buildSuccessPayload(args, output),
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

    logger.error('[WP05] Unexpected error in user ssh key delete handler', { error });
    return formatToolResponse(
      'error',
      `Failed to delete SSH key: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
