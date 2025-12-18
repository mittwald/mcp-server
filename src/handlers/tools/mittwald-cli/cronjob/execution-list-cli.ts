import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';
import { listCronjobExecutions, LibraryError } from '@mittwald-mcp/cli-core';
import { validateToolParity } from '../../../../../tests/validation/parallel-validator.js';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';
import { logger } from '../../../../utils/logger.js';

interface MittwaldCronjobExecutionListCliArgs {
  cronjobId: string;
  output?: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
  extended?: boolean;
  noHeader?: boolean;
  noTruncate?: boolean;
  noRelativeDates?: boolean;
  csvSeparator?: ',' | ';';
}

function buildCliArgs(args: MittwaldCronjobExecutionListCliArgs): string[] {
  const cliArgs: string[] = ['cronjob', 'execution', 'list'];

  cliArgs.push('--cronjob-id', args.cronjobId);
  cliArgs.push('--output', 'json');

  if (args.extended) cliArgs.push('--extended');
  if (args.noHeader) cliArgs.push('--no-header');
  if (args.noTruncate) cliArgs.push('--no-truncate');
  if (args.noRelativeDates) cliArgs.push('--no-relative-dates');
  if (args.csvSeparator) cliArgs.push('--csv-separator', args.csvSeparator);

  return cliArgs;
}

function mapCliError(error: CliToolError, args: MittwaldCronjobExecutionListCliArgs): string {
  const combined = `${error.stdout ?? ''}\n${error.stderr ?? ''}`.toLowerCase();
  const errorMessage = error.stderr || error.stdout || error.message;

  if (combined.includes('not found')) {
    return `Cronjob not found: ${args.cronjobId}.\nError: ${errorMessage}`;
  }

  if (combined.includes('permission denied') || combined.includes('forbidden')) {
    return `Permission denied when listing executions for cronjob ${args.cronjobId}. Please verify authentication.`;
  }

  return `Failed to list cronjob executions: ${errorMessage}`;
}

function formatExecutions(data: unknown[]): Record<string, unknown>[] {
  return data.map((item) => {
    if (typeof item !== 'object' || item === null) {
      return { raw: item };
    }

    const record = item as Record<string, unknown>;

    return {
      id: record.id,
      cronjobId: record.cronjobId,
      status: record.status,
      startedAt: record.startedAt,
      finishedAt: record.finishedAt,
      exitCode: record.exitCode,
      duration: record.duration,
      triggeredBy: record.triggeredBy,
      raw: record,
    };
  });
}

export const handleCronjobExecutionListCli: MittwaldCliToolHandler<MittwaldCronjobExecutionListCliArgs> = async (args, sessionId) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  if (!args.cronjobId) {
    return formatToolResponse('error', 'cronjobId is required');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  const argv = buildCliArgs(args);

  try {
    // WP04: Parallel validation - run both CLI and library
    const validation = await validateToolParity({
      toolName: 'mittwald_cronjob_execution_list',
      cliCommand: 'mw',
      cliArgs: [...argv, '--token', session.mittwaldAccessToken],
      libraryFn: async () => {
        return await listCronjobExecutions({
          cronjobId: args.cronjobId,
          apiToken: session.mittwaldAccessToken,
        });
      },
      ignoreFields: ['durationMs', 'duration', 'timestamp'],
    });

    // Log validation results
    if (!validation.passed) {
      logger.warn('[WP04 Validation] Output mismatch detected', {
        tool: 'mittwald_cronjob_execution_list',
        cronjobId: args.cronjobId,
        discrepancyCount: validation.discrepancies.length,
        discrepancies: validation.discrepancies,
        cliExitCode: validation.cliOutput.exitCode,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
      });
    } else {
      logger.info('[WP04 Validation] 100% parity achieved', {
        tool: 'mittwald_cronjob_execution_list',
        cronjobId: args.cronjobId,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
        speedup: `${((validation.cliOutput.durationMs / validation.libraryOutput.durationMs) * 100).toFixed(0)}%`,
      });
    }

    // Use library result (it's validated) - data is array directly
    const executions = validation.libraryOutput.data as any[];

    if (!executions || executions.length === 0) {
      return formatToolResponse(
        'success',
        'No cronjob executions found',
        [],
        {
          durationMs: validation.libraryOutput.durationMs,
          validationPassed: validation.passed,
          cliDuration: validation.cliOutput.durationMs,
          libraryDuration: validation.libraryOutput.durationMs,
        }
      );
    }

    const formatted = formatExecutions(executions);

    return formatToolResponse(
      'success',
      `Found ${formatted.length} cronjob execution(s)`,
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

    logger.error('[WP04] Unexpected error in cronjob execution list handler', { error });
    return formatToolResponse('error', `Failed to list cronjob executions: ${error instanceof Error ? error.message : String(error)}`);
  }
};
