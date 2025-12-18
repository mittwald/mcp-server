import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';
import { createCronjob, LibraryError } from '@mittwald-mcp/cli-core';
import { validateToolParity } from '../../../../../tests/validation/parallel-validator.js';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';
import { logger } from '../../../../utils/logger.js';

interface MittwaldCronjobCreateCliArgs {
  description: string;
  interval: string;
  installationId?: string;
  projectId?: string;
  quiet?: boolean;
  email?: string;
  url?: string;
  command?: string;
  interpreter?: 'bash' | 'php';
  disable?: boolean;
  timeout?: string;
}

function buildCliArgs(args: MittwaldCronjobCreateCliArgs): string[] {
  const cliArgs: string[] = ['cronjob', 'create'];

  cliArgs.push('--description', args.description);
  cliArgs.push('--interval', args.interval);

  if (args.installationId) {
    cliArgs.push('--installation-id', args.installationId);
  }

  if (args.quiet) {
    cliArgs.push('--quiet');
  }

  if (args.email) {
    cliArgs.push('--email', args.email);
  }

  if (args.url) {
    cliArgs.push('--url', args.url);
  }

  if (args.command) {
    cliArgs.push('--command', args.command);
  }

  if (args.interpreter) {
    cliArgs.push('--interpreter', args.interpreter);
  }

  if (args.disable) {
    cliArgs.push('--disable');
  }

  if (args.timeout) {
    cliArgs.push('--timeout', args.timeout);
  }

  return cliArgs;
}

function parseQuietIdentifier(output: string): string | undefined {
  const trimmed = output.trim();
  if (!trimmed) return undefined;
  const lines = trimmed.split(/\r?\n/);
  const last = lines.at(-1)?.trim();
  return last ? last : undefined;
}

function mapCliError(error: CliToolError, args: MittwaldCronjobCreateCliArgs): string {
  const combined = `${error.stdout ?? ''}\n${error.stderr ?? ''}`.toLowerCase();

  if (combined.includes('not found') && combined.includes('installation')) {
    return `Installation not found. Please verify the installation ID: ${args.installationId ?? 'not specified'}.\nError: ${error.stderr || error.message}`;
  }

  if (combined.includes('invalid') && combined.includes('cron expression')) {
    return `Invalid cron expression: ${args.interval}.\nError: ${error.stderr || error.message}`;
  }

  return error.message;
}

export const handleCronjobCreateCli: MittwaldCliToolHandler<MittwaldCronjobCreateCliArgs> = async (args, sessionId) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  if (!args.description) {
    return formatToolResponse('error', 'description is required');
  }

  if (!args.interval) {
    return formatToolResponse('error', 'interval is required');
  }

  if (!args.projectId && !args.installationId) {
    return formatToolResponse('error', 'Either projectId or installationId is required');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  const argv = buildCliArgs(args);

  try {
    // Build destination object for library function
    let destination: { url: string } | { interpreter: string; path: string };
    if (args.url) {
      destination = { url: args.url };
    } else if (args.command && args.interpreter) {
      destination = { interpreter: args.interpreter, path: args.command };
    } else {
      return formatToolResponse('error', 'Either url or (command + interpreter) must be provided');
    }

    // Parse timeout (CLI accepts string like "60s", library expects number)
    const timeoutMs = args.timeout ? parseInt(args.timeout.replace(/[^\d]/g, '')) * 1000 : 60000;

    // WP04: Parallel validation - run both CLI and library
    const validation = await validateToolParity({
      toolName: 'mittwald_cronjob_create',
      cliCommand: 'mw',
      cliArgs: [...argv, '--token', session.mittwaldAccessToken],
      libraryFn: async () => {
        return await createCronjob({
          projectId: args.projectId!,
          appId: args.installationId!,
          description: args.description,
          interval: args.interval,
          timeout: timeoutMs,
          active: !args.disable,
          email: args.email,
          destination,
          apiToken: session.mittwaldAccessToken,
        });
      },
      ignoreFields: ['durationMs', 'duration', 'timestamp', 'id'],
    });

    // Log validation results
    if (!validation.passed) {
      logger.warn('[WP04 Validation] Output mismatch detected', {
        tool: 'mittwald_cronjob_create',
        discrepancyCount: validation.discrepancies.length,
        discrepancies: validation.discrepancies,
        cliExitCode: validation.cliOutput.exitCode,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
      });
    } else {
      logger.info('[WP04 Validation] 100% parity achieved', {
        tool: 'mittwald_cronjob_create',
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
        speedup: `${((validation.cliOutput.durationMs / validation.libraryOutput.durationMs) * 100).toFixed(0)}%`,
      });
    }

    // Use library result (it's validated)
    const result = validation.libraryOutput.data as any;
    const cronjobId = result?.id || result;

    return formatToolResponse(
      'success',
      'Cronjob created successfully',
      {
        id: cronjobId,
        description: args.description,
        interval: args.interval,
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

    logger.error('[WP04] Unexpected error in cronjob create handler', { error });
    return formatToolResponse('error', `Failed to create cronjob: ${error instanceof Error ? error.message : String(error)}`);
  }
};
