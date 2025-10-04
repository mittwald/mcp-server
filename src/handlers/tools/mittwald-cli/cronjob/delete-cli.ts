import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { logger } from '../../../../utils/logger.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';

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

export const handleCronjobDeleteCli: MittwaldToolHandler<MittwaldCronjobDeleteCliArgs> = async (args, context) => {
  if (!args.cronjobId) {
    return formatToolResponse('error', 'Cronjob ID is required.');
  }

  if (args.confirm !== true) {
    return formatToolResponse(
      'error',
      'Cronjob deletion requires confirm=true. This operation is destructive and cannot be undone.'
    );
  }

  logger.warn('[CronjobDelete] Destructive operation attempted', {
    cronjobId: args.cronjobId,
    force: Boolean(args.force),
    sessionId: context?.sessionId,
    userId: context?.userId,
  });

  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_cronjob_delete',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout ?? '';
    const stderr = result.result.stderr ?? '';
    const output = stdout || stderr;

    if (args.quiet) {
      const quietOutput = parseQuietOutput(stdout) ?? parseQuietOutput(stderr);

      return formatToolResponse(
        'success',
        'Cronjob deleted successfully',
        {
          cronjobId: quietOutput ?? args.cronjobId,
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
      'Cronjob deleted successfully',
      {
        cronjobId: args.cronjobId,
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
