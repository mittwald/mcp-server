import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';
import { abortCronjobExecution, LibraryError } from '@mittwald-mcp/cli-core';
import { validateToolParity } from '../../../../../tests/validation/parallel-validator.js';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';
import { logger } from '../../../../utils/logger.js';

interface MittwaldCronjobExecutionAbortCliArgs {
  cronjobId: string;
  executionId: string;
  quiet?: boolean;
}

function buildCliArgs(args: MittwaldCronjobExecutionAbortCliArgs): string[] {
  const cliArgs: string[] = ['cronjob', 'execution', 'abort', args.cronjobId, args.executionId];

  if (args.quiet) {
    cliArgs.push('--quiet');
  }

  return cliArgs;
}

function mapCliError(error: CliToolError, args: MittwaldCronjobExecutionAbortCliArgs): string {
  const combined = `${error.stdout ?? ''}\n${error.stderr ?? ''}`.toLowerCase();
  const errorMessage = error.stderr || error.stdout || error.message;

  if (combined.includes('not found')) {
    return `Cronjob or execution not found: ${args.cronjobId} / ${args.executionId}.\nError: ${errorMessage}`;
  }

  if (combined.includes('already finished') || combined.includes('not running')) {
    return `Cronjob execution is not running or already finished: ${args.executionId}.\nError: ${errorMessage}`;
  }

  if (combined.includes('permission denied') || combined.includes('forbidden')) {
    return `Permission denied when aborting cronjob execution ${args.executionId}. Ensure the current user has sufficient privileges.\nError: ${errorMessage}`;
  }

  return `Failed to abort cronjob execution: ${errorMessage}`;
}

export const handleCronjobExecutionAbortCli: MittwaldCliToolHandler<MittwaldCronjobExecutionAbortCliArgs> = async (args, sessionId) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  if (!args.cronjobId) {
    return formatToolResponse('error', 'cronjobId is required');
  }

  if (!args.executionId) {
    return formatToolResponse('error', 'executionId is required');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  const argv = buildCliArgs(args);

  try {
    // WP04: Parallel validation - run both CLI and library
    const validation = await validateToolParity({
      toolName: 'mittwald_cronjob_execution_abort',
      cliCommand: 'mw',
      cliArgs: [...argv, '--token', session.mittwaldAccessToken],
      libraryFn: async () => {
        return await abortCronjobExecution({
          cronjobId: args.cronjobId,
          executionId: args.executionId,
          apiToken: session.mittwaldAccessToken,
        });
      },
      ignoreFields: ['durationMs', 'duration', 'timestamp'],
    });

    // Log validation results
    if (!validation.passed) {
      logger.warn('[WP04 Validation] Output mismatch detected', {
        tool: 'mittwald_cronjob_execution_abort',
        cronjobId: args.cronjobId,
        executionId: args.executionId,
        discrepancyCount: validation.discrepancies.length,
        discrepancies: validation.discrepancies,
        cliExitCode: validation.cliOutput.exitCode,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
      });
    } else {
      logger.info('[WP04 Validation] 100% parity achieved', {
        tool: 'mittwald_cronjob_execution_abort',
        cronjobId: args.cronjobId,
        executionId: args.executionId,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
        speedup: `${((validation.cliOutput.durationMs / validation.libraryOutput.durationMs) * 100).toFixed(0)}%`,
      });
    }

    return formatToolResponse(
      'success',
      'Cronjob execution aborted successfully',
      {
        cronjobId: args.cronjobId,
        executionId: args.executionId,
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

    logger.error('[WP04] Unexpected error in cronjob execution abort handler', { error });
    return formatToolResponse('error', `Failed to abort cronjob execution: ${error instanceof Error ? error.message : String(error)}`);
  }
};
