import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';

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

function parseExecutionList(output: string): unknown {
  const trimmed = output.trim();
  if (!trimmed) return [];

  try {
    return JSON.parse(trimmed);
  } catch (error) {
    throw new Error(`Failed to parse JSON output: ${error instanceof Error ? error.message : String(error)}`);
  }
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

export const handleCronjobExecutionListCli: MittwaldToolHandler<MittwaldCronjobExecutionListCliArgs> = async (args, _context) => {
  if (!args.cronjobId) {
    return formatToolResponse('error', 'Cronjob ID is required.');
  }

  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_cronjob_execution_list',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout ?? '';
    const stderr = result.result.stderr ?? '';

    try {
      const parsed = parseExecutionList(stdout);
      if (!Array.isArray(parsed)) {
        return formatToolResponse(
          'error',
          'Unexpected output format from CLI command',
          {
            cronjobId: args.cronjobId,
            rawOutput: stdout,
          },
          {
            command: result.meta.command,
            durationMs: result.meta.durationMs,
          }
        );
      }

      if (parsed.length === 0) {
        return formatToolResponse(
          'success',
          'No cronjob executions found',
          [],
          {
            command: result.meta.command,
            durationMs: result.meta.durationMs,
          }
        );
      }

      const formatted = formatExecutions(parsed);

      return formatToolResponse(
        'success',
        `Found ${formatted.length} cronjob execution(s)`,
        formatted,
        {
          command: result.meta.command,
          durationMs: result.meta.durationMs,
        }
      );
    } catch (parseError) {
      return formatToolResponse(
        'success',
        'Cronjob executions retrieved (raw output)',
        {
          cronjobId: args.cronjobId,
          rawOutput: stdout || stderr,
          parseError: parseError instanceof Error ? parseError.message : String(parseError),
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
