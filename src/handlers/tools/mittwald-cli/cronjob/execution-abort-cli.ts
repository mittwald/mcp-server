import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';

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

function parseQuietOutput(output: string): string | undefined {
  const trimmed = output.trim();
  if (!trimmed) return undefined;
  const lines = trimmed.split(/\r?\n/);
  return lines.at(-1)?.trim();
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

export const handleCronjobExecutionAbortCli: MittwaldToolHandler<MittwaldCronjobExecutionAbortCliArgs> = async (args, _context) => {
  if (!args.cronjobId) {
    return formatToolResponse('error', 'Cronjob ID is required.');
  }

  if (!args.executionId) {
    return formatToolResponse('error', 'Execution ID is required.');
  }

  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_cronjob_execution_abort',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout ?? '';
    const stderr = result.result.stderr ?? '';
    const output = stdout || stderr;

    if (args.quiet) {
      const quietOutput = parseQuietOutput(stdout) ?? parseQuietOutput(stderr);

      if (quietOutput) {
        return formatToolResponse(
          'success',
          'Cronjob execution aborted successfully',
          {
            cronjobId: args.cronjobId,
            executionId: quietOutput,
          },
          {
            command: result.meta.command,
            durationMs: result.meta.durationMs,
          }
        );
      }

      return formatToolResponse(
        'success',
        'Cronjob execution aborted successfully',
        {
          cronjobId: args.cronjobId,
          executionId: args.executionId,
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
      'Cronjob execution aborted successfully',
      {
        cronjobId: args.cronjobId,
        executionId: args.executionId,
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
