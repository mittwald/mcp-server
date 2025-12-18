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

export const handleCronjobUpdateCli: MittwaldToolHandler<MittwaldCronjobUpdateCliArgs> = async (args, _context) => {
  if (!args.cronjobId) {
    return formatToolResponse('error', 'Cronjob ID is required.');
  }

  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_cronjob_update',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout ?? '';
    const stderr = result.result.stderr ?? '';
    const output = stdout || stderr;

    if (args.quiet) {
      const quietValue = parseQuietIdentifier(stdout) ?? parseQuietIdentifier(stderr);

      return formatToolResponse(
        'success',
        'Cronjob updated successfully',
        {
          cronjobId: quietValue ?? args.cronjobId,
          description: args.description,
          interval: args.interval,
          command: args.command,
          url: args.url,
          email: args.email,
          enable: args.enable,
          disable: args.disable,
          timeout: args.timeout,
          output,
        },
        {
          command: result.meta.command,
          durationMs: result.meta.durationMs,
        }
      );
    }

    return formatToolResponse(
      'success',
      'Cronjob updated successfully',
      {
        cronjobId: args.cronjobId,
        description: args.description,
        interval: args.interval,
        command: args.command,
        url: args.url,
        email: args.email,
        enable: args.enable,
        disable: args.disable,
        timeout: args.timeout,
        output,
      },
      {
        command: result.meta.command,
        durationMs: result.meta.durationMs,
      }
    );
  } catch (error) {
    if (error instanceof CliToolError) {
      const message = mapCliError(error, args);
      return formatToolResponse('error', message, {
        exitCode: error.exitCode,
        stderr: error.stderr,
        stdout: error.stdout,
        suggestedAction: error.suggestedAction,
      });
    }

    return formatToolResponse('error', `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`);
  }
};
