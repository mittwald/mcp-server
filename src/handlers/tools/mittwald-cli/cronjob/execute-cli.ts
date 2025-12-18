import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';
import { executeCronjob, LibraryError } from '@mittwald-mcp/cli-core';
import { validateToolParity } from '../../../../../tests/validation/parallel-validator.js';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';
import { logger } from '../../../../utils/logger.js';

interface MittwaldCronjobExecuteCliArgs {
  cronjobId: string;
  quiet?: boolean;
}

function buildCliArgs(args: MittwaldCronjobExecuteCliArgs): string[] {
  const cliArgs: string[] = ['cronjob', 'execute', args.cronjobId];

  if (args.quiet) {
    cliArgs.push('--quiet');
  }

  return cliArgs;
}

function parseQuietIdentifier(output: string): string | undefined {
  const trimmed = output.trim();
  if (!trimmed) return undefined;
  const lines = trimmed.split(/\r?\n/);
  return lines.at(-1)?.trim();
}

function mapCliError(error: CliToolError, args: MittwaldCronjobExecuteCliArgs): string {
  const combined = `${error.stdout ?? ''}\n${error.stderr ?? ''}`.toLowerCase();
  const message = error.stderr || error.stdout || error.message;

  if (combined.includes('not found')) {
    return `Cronjob not found: ${args.cronjobId}.\nError: ${message}`;
  }

  if (combined.includes('permission denied') || combined.includes('forbidden')) {
    return `Permission denied when executing cronjob ${args.cronjobId}. Please re-authenticate with Mittwald CLI.`;
  }

  return `Failed to execute cronjob: ${message}`;
}

export const handleCronjobExecuteCli: MittwaldCliToolHandler<MittwaldCronjobExecuteCliArgs> = async (args, sessionId) => {
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
      toolName: 'mittwald_cronjob_execute',
      cliCommand: 'mw',
      cliArgs: [...argv, '--token', session.mittwaldAccessToken],
      libraryFn: async () => {
        return await executeCronjob({
          cronjobId: args.cronjobId,
          apiToken: session.mittwaldAccessToken,
        });
      },
      ignoreFields: ['durationMs', 'duration', 'timestamp', 'id', 'executionId'],
    });

    // Log validation results
    if (!validation.passed) {
      logger.warn('[WP04 Validation] Output mismatch detected', {
        tool: 'mittwald_cronjob_execute',
        cronjobId: args.cronjobId,
        discrepancyCount: validation.discrepancies.length,
        discrepancies: validation.discrepancies,
        cliExitCode: validation.cliOutput.exitCode,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
      });
    } else {
      logger.info('[WP04 Validation] 100% parity achieved', {
        tool: 'mittwald_cronjob_execute',
        cronjobId: args.cronjobId,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
        speedup: `${((validation.cliOutput.durationMs / validation.libraryOutput.durationMs) * 100).toFixed(0)}%`,
      });
    }

    // Use library result (it's validated)
    const result = validation.libraryOutput.data as any;
    const executionId = result?.id || result;

    return formatToolResponse(
      'success',
      'Cronjob execution started',
      {
        cronjobId: args.cronjobId,
        executionId,
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

    logger.error('[WP04] Unexpected error in cronjob execute handler', { error });
    return formatToolResponse('error', `Failed to execute cronjob: ${error instanceof Error ? error.message : String(error)}`);
  }
};
