import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { logger } from '../../../../utils/logger.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';
import { deleteCronjob, LibraryError } from '@mittwald-mcp/cli-core';
import { validateToolParity } from '../../../../../tests/validation/parallel-validator.js';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';

interface MittwaldCronjobDeleteCliArgs {
  cronjobId: string;
  confirm?: boolean;
  quiet?: boolean;
  force?: boolean;
}

function buildCliArgs(args: MittwaldCronjobDeleteCliArgs): string[] {
  const cliArgs: string[] = ['cronjob', 'delete', args.cronjobId];

  if (args.quiet) {
    cliArgs.push('--quiet');
  }

  if (args.force) {
    cliArgs.push('--force');
  }

  return cliArgs;
}

function parseQuietOutput(output: string): string | undefined {
  const trimmed = output.trim();
  if (!trimmed) return undefined;
  const lines = trimmed.split(/\r?\n/);
  return lines.at(-1)?.trim();
}

function mapCliError(error: CliToolError, args: MittwaldCronjobDeleteCliArgs): string {
  const combined = `${error.stdout ?? ''}\n${error.stderr ?? ''}`.toLowerCase();
  const errorMessage = error.stderr || error.stdout || error.message;

  if (combined.includes('not found')) {
    return `Cronjob not found: ${args.cronjobId}.\nError: ${errorMessage}`;
  }

  if (combined.includes('permission denied') || combined.includes('forbidden')) {
    return `Permission denied when deleting cronjob ${args.cronjobId}. Please ensure you are authenticated with sufficient privileges.\nError: ${errorMessage}`;
  }

  return `Failed to delete cronjob: ${errorMessage}`;
}

export const handleCronjobDeleteCli: MittwaldCliToolHandler<MittwaldCronjobDeleteCliArgs> = async (args, sessionId) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  if (!args.cronjobId) {
    return formatToolResponse('error', 'cronjobId is required');
  }

  if (args.confirm !== true) {
    return formatToolResponse(
      'error',
      'Cronjob deletion requires confirm=true. This operation is destructive and cannot be undone.'
    );
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  logger.warn('[CronjobDelete] Destructive operation attempted', {
    cronjobId: args.cronjobId,
    force: Boolean(args.force),
    sessionId: effectiveSessionId,
  });

  const argv = buildCliArgs(args);

  try {
    // WP04: Parallel validation - run both CLI and library
    const validation = await validateToolParity({
      toolName: 'mittwald_cronjob_delete',
      cliCommand: 'mw',
      cliArgs: [...argv, '--token', session.mittwaldAccessToken],
      libraryFn: async () => {
        return await deleteCronjob({
          cronjobId: args.cronjobId,
          apiToken: session.mittwaldAccessToken,
        });
      },
      ignoreFields: ['durationMs', 'duration', 'timestamp'],
    });

    // Log validation results
    if (!validation.passed) {
      logger.warn('[WP04 Validation] Output mismatch detected', {
        tool: 'mittwald_cronjob_delete',
        cronjobId: args.cronjobId,
        discrepancyCount: validation.discrepancies.length,
        discrepancies: validation.discrepancies,
        cliExitCode: validation.cliOutput.exitCode,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
      });
    } else {
      logger.info('[WP04 Validation] 100% parity achieved', {
        tool: 'mittwald_cronjob_delete',
        cronjobId: args.cronjobId,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
        speedup: `${((validation.cliOutput.durationMs / validation.libraryOutput.durationMs) * 100).toFixed(0)}%`,
      });
    }

    return formatToolResponse(
      'success',
      'Cronjob deleted successfully',
      {
        cronjobId: args.cronjobId,
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

    logger.error('[WP04] Unexpected error in cronjob delete handler', { error });
    return formatToolResponse('error', `Failed to delete cronjob: ${error instanceof Error ? error.message : String(error)}`);
  }
};
