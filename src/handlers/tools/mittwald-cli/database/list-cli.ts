import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';

interface MittwaldDatabaseListArgs {
  projectId?: string;
  output?: "txt" | "json" | "yaml" | "csv" | "tsv";
  extended?: boolean;
  noHeader?: boolean;
  noTruncate?: boolean;
  noRelativeDates?: boolean;
  csvSeparator?: ',' | ';';
}

function buildCliArgs(args: MittwaldDatabaseListArgs): string[] {
  const cliArgs: string[] = ['database', 'list'];

  cliArgs.push('--output', 'json');

  if (args.projectId) cliArgs.push('--project-id', args.projectId);
  if (args.extended) cliArgs.push('--extended');
  if (args.noHeader) cliArgs.push('--no-header');
  if (args.noTruncate) cliArgs.push('--no-truncate');
  if (args.noRelativeDates) cliArgs.push('--no-relative-dates');
  if (args.csvSeparator) cliArgs.push('--csv-separator', args.csvSeparator);

  return cliArgs;
}

function mapCliError(error: CliToolError, args: MittwaldDatabaseListArgs): string {
  const combined = `${error.stdout ?? ''}\n${error.stderr ?? ''}`.toLowerCase();
  const message = error.stderr || error.stdout || error.message;

  if (combined.includes('not found') && combined.includes('project')) {
    return `Project not found. Please verify the project ID: ${args.projectId ?? 'not specified'}.\nError: ${message}`;
  }

  if (combined.includes('permission denied') || combined.includes('forbidden') || combined.includes('403')) {
    return `Permission denied when accessing databases. Complete OAuth sign-in and ensure the Mittwald CLI is authenticated.\nError: ${message}`;
  }

  return `Failed to list databases: ${message}`;
}

function parseDatabaseList(output: string): unknown {
  const trimmed = output.trim();
  if (!trimmed) return [];

  try {
    return JSON.parse(trimmed);
  } catch (error) {
    throw new Error(`Failed to parse JSON output: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function formatDatabases(data: unknown[]): Record<string, unknown>[] {
  return data.map((item) => {
    if (typeof item !== 'object' || item === null) {
      return { raw: item };
    }

    const record = item as Record<string, unknown>;
    return {
      id: record.id,
      name: record.name,
      description: record.description,
      projectId: record.projectId,
      type: record.type,
      status: record.status,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      raw: record,
    };
  });
}

export const handleDatabaseListCli: MittwaldToolHandler<MittwaldDatabaseListArgs> = async (args) => {
  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_database_list',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout ?? '';
    const stderr = result.result.stderr ?? '';

    try {
      const parsed = parseDatabaseList(stdout);

      if (!Array.isArray(parsed)) {
        return formatToolResponse(
          'error',
          'Unexpected output format from CLI command',
          {
            projectId: args.projectId,
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
          'No databases found',
          [],
          {
            command: result.meta.command,
            durationMs: result.meta.durationMs,
          }
        );
      }

      const formatted = formatDatabases(parsed);

      return formatToolResponse(
        'success',
        `Found ${formatted.length} database(s)`,
        formatted,
        {
          command: result.meta.command,
          durationMs: result.meta.durationMs,
        }
      );
    } catch (parseError) {
      return formatToolResponse(
        'success',
        'Databases retrieved (raw output)',
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
