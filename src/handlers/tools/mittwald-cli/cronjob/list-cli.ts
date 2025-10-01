import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';

interface MittwaldCronjobListCliArgs {
  projectId?: string;
  output?: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
  extended?: boolean;
  noHeader?: boolean;
  noTruncate?: boolean;
  noRelativeDates?: boolean;
  csvSeparator?: ',' | ';';
}

function buildCliArgs(args: MittwaldCronjobListCliArgs): string[] {
  const cliArgs: string[] = ['cronjob', 'list'];

  cliArgs.push('--output', 'json');

  if (args.projectId) cliArgs.push('--project-id', args.projectId);
  if (args.extended) cliArgs.push('--extended');
  if (args.noHeader) cliArgs.push('--no-header');
  if (args.noTruncate) cliArgs.push('--no-truncate');
  if (args.noRelativeDates) cliArgs.push('--no-relative-dates');
  if (args.csvSeparator) cliArgs.push('--csv-separator', args.csvSeparator);

  return cliArgs;
}

function mapCliError(error: CliToolError, args: MittwaldCronjobListCliArgs): string {
  const combined = `${error.stdout ?? ''}\n${error.stderr ?? ''}`.toLowerCase();
  const message = error.stderr || error.stdout || error.message;

  if (combined.includes('not found') && combined.includes('project')) {
    return `Project not found. Please verify the project ID: ${args.projectId || 'not specified'}.\nError: ${message}`;
  }

  if (combined.includes('permission denied') || combined.includes('forbidden')) {
    return `Permission denied when listing cronjobs. Please re-authenticate with the Mittwald CLI.`;
  }

  return `Failed to list cronjobs: ${message}`;
}

function parseCronjobList(output: string): unknown {
  const trimmed = output.trim();
  if (!trimmed) return [];

  try {
    return JSON.parse(trimmed);
  } catch (error) {
    throw new Error(`Failed to parse JSON output: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function formatCronjobs(data: unknown[]): Record<string, unknown>[] {
  return data.map((item) => {
    if (typeof item !== 'object' || item === null) {
      return { raw: item };
    }

    const record = item as Record<string, unknown>;
    return {
      id: record.id,
      description: record.description,
      expression: record.expression,
      command: record.command,
      enabled: record.enabled,
      projectId: record.projectId,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      raw: record,
    };
  });
}

export const handleCronjobListCli: MittwaldToolHandler<MittwaldCronjobListCliArgs> = async (args, _context) => {
  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_cronjob_list',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout ?? '';
    const stderr = result.result.stderr ?? '';

    try {
      const parsed = parseCronjobList(stdout);

      if (!Array.isArray(parsed)) {
        return formatToolResponse(
          'error',
          'Unexpected output format from CLI command',
          {
            rawOutput: stdout,
            projectId: args.projectId,
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
          'No cronjobs found',
          [],
          {
            command: result.meta.command,
            durationMs: result.meta.durationMs,
          }
        );
      }

      const formatted = formatCronjobs(parsed);

      return formatToolResponse(
        'success',
        `Found ${formatted.length} cronjob(s)`,
        formatted,
        {
          command: result.meta.command,
          durationMs: result.meta.durationMs,
        }
      );
    } catch (parseError) {
      return formatToolResponse(
        'success',
        'Cronjobs retrieved (raw output)',
        {
          projectId: args.projectId,
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
