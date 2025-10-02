import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';

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

function parseExecutionJson(output: string): Record<string, unknown> {
  const trimmed = output.trim();
  if (!trimmed) {
    throw new Error('No output received from CLI.');
  }

  try {
    const data = JSON.parse(trimmed);
    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
      throw new Error('Expected JSON object.');
    }
    return data as Record<string, unknown>;
  } catch (error) {
    throw new Error(`Failed to parse JSON output: ${error instanceof Error ? error.message : String(error)}`);
  }
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

export const handleCronjobExecutionGetCli: MittwaldToolHandler<MittwaldCronjobExecutionGetCliArgs> = async (args, _context) => {
  if (!args.cronjobId) {
    return formatToolResponse('error', 'Cronjob ID is required.');
  }

  if (!args.executionId) {
    return formatToolResponse('error', 'Execution ID is required.');
  }

  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_cronjob_execution_get',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout ?? '';
    const stderr = result.result.stderr ?? '';

    try {
      const parsed = parseExecutionJson(stdout);
      const formatted = formatExecution(parsed);
      const executionId = typeof formatted.id === 'string' ? formatted.id : args.executionId;

      return formatToolResponse(
        'success',
        `Cronjob execution details for ${executionId}`,
        formatted,
        {
          command: result.meta.command,
          durationMs: result.meta.durationMs,
        }
      );
    } catch (parseError) {
      const errorMessage = parseError instanceof Error ? parseError.message : String(parseError);
      return formatToolResponse(
        'success',
        'Cronjob execution retrieved (raw output)',
        {
          cronjobId: args.cronjobId,
          executionId: args.executionId,
          rawOutput: stdout || stderr,
          parseError: errorMessage,
        },
        {
          command: result.meta.command,
          durationMs: result.meta.durationMs,
        }
      );
    }
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
