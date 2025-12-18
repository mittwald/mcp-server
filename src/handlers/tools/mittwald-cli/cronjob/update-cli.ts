import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';
import { updateCronjob, LibraryError } from '@mittwald-mcp/cli-core';
import { validateToolParity } from '../../../../../tests/validation/parallel-validator.js';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';
import { logger } from '../../../../utils/logger.js';

interface MittwaldCronjobUpdateCliArgs {
  cronjobId: string;
  quiet?: boolean;
  description?: string;
  interval?: string;
  email?: string;
  url?: string;
  command?: string;
  interpreter?: 'bash' | 'php';
  enable?: boolean;
  disable?: boolean;
  timeout?: string;
}

function buildCliArgs(args: MittwaldCronjobUpdateCliArgs): string[] {
  const cliArgs: string[] = ['cronjob', 'update', args.cronjobId];

  if (args.quiet) cliArgs.push('--quiet');
  if (args.description) cliArgs.push('--description', args.description);
  if (args.interval) cliArgs.push('--interval', args.interval);
  if (args.email) cliArgs.push('--email', args.email);
  if (args.url) cliArgs.push('--url', args.url);
  if (args.command) cliArgs.push('--command', args.command);
  if (args.interpreter) cliArgs.push('--interpreter', args.interpreter);
  if (args.enable) cliArgs.push('--enable');
  if (args.disable) cliArgs.push('--disable');
  if (args.timeout) cliArgs.push('--timeout', args.timeout);

  return cliArgs;
}

function parseQuietIdentifier(output: string): string | undefined {
  const trimmed = output.trim();
  if (!trimmed) return undefined;
  const lines = trimmed.split(/\r?\n/);
  return lines.at(-1)?.trim();
}

function mapCliError(error: CliToolError, args: MittwaldCronjobUpdateCliArgs): string {
  const combined = `${error.stdout ?? ''}\n${error.stderr ?? ''}`.toLowerCase();
  const message = error.stderr || error.stdout || error.message;

  if (combined.includes('not found')) {
    return `Cronjob not found: ${args.cronjobId}.\nError: ${message}`;
  }

  if (combined.includes('invalid') && combined.includes('cron expression')) {
    return `Invalid cron expression: ${args.interval ?? 'not provided'}.\nError: ${message}`;
  }

  if (combined.includes('permission denied') || combined.includes('forbidden')) {
    return `Permission denied when updating cronjob ${args.cronjobId}. Please re-authenticate with the Mittwald CLI.`;
  }

  return `Failed to update cronjob: ${message}`;
}

export const handleCronjobUpdateCli: MittwaldCliToolHandler<MittwaldCronjobUpdateCliArgs> = async (args, sessionId) => {
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
    // Build destination object if url or command is provided
    let destination: { url: string } | { interpreter: string; path: string } | undefined;
    if (args.url) {
      destination = { url: args.url };
    } else if (args.command && args.interpreter) {
      destination = { interpreter: args.interpreter, path: args.command };
    }

    // Parse timeout if provided
    const timeoutMs = args.timeout ? parseInt(args.timeout.replace(/[^\d]/g, '')) * 1000 : undefined;

    // Determine active state
    let active: boolean | undefined;
    if (args.enable) active = true;
    if (args.disable) active = false;

    // WP04: Parallel validation - run both CLI and library
    const validation = await validateToolParity({
      toolName: 'mittwald_cronjob_update',
      cliCommand: 'mw',
      cliArgs: [...argv, '--token', session.mittwaldAccessToken],
      libraryFn: async () => {
        return await updateCronjob({
          cronjobId: args.cronjobId,
          description: args.description,
          interval: args.interval,
          email: args.email,
          destination,
          timeout: timeoutMs,
          active,
          apiToken: session.mittwaldAccessToken,
        });
      },
      ignoreFields: ['durationMs', 'duration', 'timestamp'],
    });

    // Log validation results
    if (!validation.passed) {
      logger.warn('[WP04 Validation] Output mismatch detected', {
        tool: 'mittwald_cronjob_update',
        cronjobId: args.cronjobId,
        discrepancyCount: validation.discrepancies.length,
        discrepancies: validation.discrepancies,
        cliExitCode: validation.cliOutput.exitCode,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
      });
    } else {
      logger.info('[WP04 Validation] 100% parity achieved', {
        tool: 'mittwald_cronjob_update',
        cronjobId: args.cronjobId,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
        speedup: `${((validation.cliOutput.durationMs / validation.libraryOutput.durationMs) * 100).toFixed(0)}%`,
      });
    }

    return formatToolResponse(
      'success',
      'Cronjob updated successfully',
      {
        cronjobId: args.cronjobId,
        description: args.description,
        interval: args.interval,
        email: args.email,
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

    logger.error('[WP04] Unexpected error in cronjob update handler', { error });
    return formatToolResponse('error', `Failed to update cronjob: ${error instanceof Error ? error.message : String(error)}`);
  }
};
