import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';
import { getCronjobExecution, LibraryError } from '@mittwald-mcp/cli-core';
import { validateToolParity } from '../../../../../tests/validation/parallel-validator.js';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';
import { logger } from '../../../../utils/logger.js';

interface MittwaldCronjobExecutionGetCliArgs {
  cronjobId: string;
  executionId: string;
  output?: 'txt' | 'json' | 'yaml';
}

function buildCliArgs(args: MittwaldCronjobExecutionGetCliArgs): string[] {
  const cliArgs: string[] = ['cronjob', 'execution', 'get', args.cronjobId, args.executionId];
  cliArgs.push('--output', 'json');
  return cliArgs;
}

function mapCliError(error: CliToolError, args: MittwaldCronjobExecutionGetCliArgs): string {
  const combined = `${error.stdout ?? ''}\n${error.stderr ?? ''}`.toLowerCase();
  const errorMessage = error.stderr || error.stdout || error.message;

  if (combined.includes('not found')) {
    return `Cronjob or execution not found: ${args.cronjobId} / ${args.executionId}.\nError: ${errorMessage}`;
  }

  if (combined.includes('permission denied') || combined.includes('forbidden')) {
    return `Permission denied when retrieving cronjob execution ${args.executionId}. Ensure proper authentication.\nError: ${errorMessage}`;
  }

  return `Failed to get cronjob execution: ${errorMessage}`;
}

function formatExecution(data: Record<string, unknown>): Record<string, unknown> {
  return {
    id: data.id,
    cronjobId: data.cronjobId,
    status: data.status,
    startedAt: data.startedAt,
    finishedAt: data.finishedAt,
    exitCode: data.exitCode,
    duration: data.duration,
    triggeredBy: data.triggeredBy,
    raw: data,
  };
}

export const handleCronjobExecutionGetCli: MittwaldCliToolHandler<MittwaldCronjobExecutionGetCliArgs> = async (args, sessionId) => {
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
      toolName: 'mittwald_cronjob_execution_get',
      cliCommand: 'mw',
      cliArgs: [...argv, '--token', session.mittwaldAccessToken],
      libraryFn: async () => {
        return await getCronjobExecution({
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
        tool: 'mittwald_cronjob_execution_get',
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
        tool: 'mittwald_cronjob_execution_get',
        cronjobId: args.cronjobId,
        executionId: args.executionId,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
        speedup: `${((validation.cliOutput.durationMs / validation.libraryOutput.durationMs) * 100).toFixed(0)}%`,
      });
    }

    // Use library result (it's validated)
    const execution = validation.libraryOutput.data as Record<string, unknown>;
    const formatted = formatExecution(execution);
    const executionId = typeof formatted.id === 'string' ? formatted.id : args.executionId;

    return formatToolResponse(
      'success',
      `Cronjob execution details for ${executionId}`,
      formatted,
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

    logger.error('[WP04] Unexpected error in cronjob execution get handler', { error });
    return formatToolResponse('error', `Failed to get cronjob execution: ${error instanceof Error ? error.message : String(error)}`);
  }
};
