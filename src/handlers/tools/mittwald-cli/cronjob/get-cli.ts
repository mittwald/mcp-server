import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';
import { getCronjob, LibraryError } from '@mittwald-mcp/cli-core';
import { validateToolParity } from '../../../../../tests/validation/parallel-validator.js';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';
import { logger } from '../../../../utils/logger.js';

interface MittwaldCronjobGetCliArgs {
  cronjobId: string;
  output?: 'txt' | 'json' | 'yaml';
}

function buildCliArgs(args: MittwaldCronjobGetCliArgs): string[] {
  const cliArgs: string[] = ['cronjob', 'get', args.cronjobId];
  cliArgs.push('--output', 'json');
  return cliArgs;
}

function mapCliError(error: CliToolError, args: MittwaldCronjobGetCliArgs): string {
  const combined = `${error.stdout ?? ''}\n${error.stderr ?? ''}`.toLowerCase();
  const message = error.stderr || error.stdout || error.message;

  if (combined.includes('not found')) {
    return `Cronjob not found: ${args.cronjobId}.\nError: ${message}`;
  }

  if (combined.includes('permission denied') || combined.includes('forbidden')) {
    return `Permission denied when retrieving cronjob ${args.cronjobId}. Please ensure you are authenticated with the correct Mittwald account.`;
  }

  return `Failed to get cronjob: ${message}`;
}

function parseCronjob(output: string): Record<string, unknown> {
  const trimmed = output.trim();
  if (!trimmed) {
    throw new Error('CLI returned empty output.');
  }

  try {
    const data = JSON.parse(trimmed);
    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
      throw new Error('Unexpected JSON structure.');
    }
    return data as Record<string, unknown>;
  } catch (error) {
    throw new Error(`Failed to parse JSON output: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function formatCronjob(data: Record<string, unknown>): Record<string, unknown> {
  return {
    id: data.id,
    description: data.description,
    expression: data.expression,
    command: data.command,
    enabled: data.enabled,
    projectId: data.projectId,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    lastExecutedAt: data.lastExecutedAt,
    raw: data,
  };
}

export const handleCronjobGetCli: MittwaldCliToolHandler<MittwaldCronjobGetCliArgs> = async (args, sessionId) => {
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
      toolName: 'mittwald_cronjob_get',
      cliCommand: 'mw',
      cliArgs: [...argv, '--token', session.mittwaldAccessToken],
      libraryFn: async () => {
        return await getCronjob({
          cronjobId: args.cronjobId,
          apiToken: session.mittwaldAccessToken,
        });
      },
      ignoreFields: ['durationMs', 'duration', 'timestamp'],
    });

    // Log validation results
    if (!validation.passed) {
      logger.warn('[WP04 Validation] Output mismatch detected', {
        tool: 'mittwald_cronjob_get',
        cronjobId: args.cronjobId,
        discrepancyCount: validation.discrepancies.length,
        discrepancies: validation.discrepancies,
        cliExitCode: validation.cliOutput.exitCode,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
      });
    } else {
      logger.info('[WP04 Validation] 100% parity achieved', {
        tool: 'mittwald_cronjob_get',
        cronjobId: args.cronjobId,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
        speedup: `${((validation.cliOutput.durationMs / validation.libraryOutput.durationMs) * 100).toFixed(0)}%`,
      });
    }

    // Use library result (it's validated)
    const cronjob = validation.libraryOutput.data;
    const formatted = formatCronjob(cronjob as Record<string, unknown>);
    const cronjobId = typeof formatted.id === 'string' ? formatted.id : args.cronjobId;

    return formatToolResponse(
      'success',
      `Cronjob details for ${cronjobId}`,
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

    logger.error('[WP04] Unexpected error in cronjob get handler', { error });
    return formatToolResponse('error', `Failed to get cronjob: ${error instanceof Error ? error.message : String(error)}`);
  }
};
