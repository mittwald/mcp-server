import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { parseJsonOutput } from '../../../../../utils/cli-wrapper.js';
import { logger } from '../../../../../utils/logger.js';
import { invokeCliTool, CliToolError } from '../../../../../tools/index.js';

interface MittwaldDatabaseRedisListArgs {
  projectId: string;
  outputFormat?: 'json' | 'yaml' | 'txt' | 'csv' | 'tsv';
  extended?: boolean;
  noHeader?: boolean;
  noTruncate?: boolean;
  noRelativeDates?: boolean;
  csvSeparator?: ',' | ';';
}

interface RedisDatabaseListItem {
  id: string;
  name?: string;
  description?: string;
  version?: string;
  hostname?: string;
  persistent?: boolean;
  status?: string;
  createdAt?: string;
}

function buildCliArgs(args: MittwaldDatabaseRedisListArgs): string[] {
  const cliArgs: string[] = [
    'database',
    'redis',
    'list',
    '--project-id',
    args.projectId,
    '--output',
    args.outputFormat ?? 'json',
  ];

  if (args.extended) cliArgs.push('--extended');
  if (args.noHeader) cliArgs.push('--no-header');
  if (args.noTruncate) cliArgs.push('--no-truncate');
  if (args.noRelativeDates) cliArgs.push('--no-relative-dates');
  if (args.csvSeparator) cliArgs.push('--csv-separator', args.csvSeparator);

  return cliArgs;
}

function mapCliError(error: CliToolError, args: MittwaldDatabaseRedisListArgs): string {
  const combined = `${error.stderr ?? ''}\n${error.stdout ?? ''}`.toLowerCase();
  const message = error.stderr || error.stdout || error.message;

  if (combined.includes('permission denied') || combined.includes('forbidden') || combined.includes('401')) {
    return `Permission denied while listing Redis databases. Re-authenticate and ensure the Mittwald CLI session is valid.\nError: ${message}`;
  }

  if (combined.includes('project') && combined.includes('not found')) {
    return `Project not found. Verify the project ID: ${args.projectId}.\nError: ${message}`;
  }

  return `Failed to list Redis databases: ${message}`;
}

/**
 * Handle listing Redis databases for a project through the Mittwald CLI wrapper.
 */
export const handleDatabaseRedisListCli: MittwaldCliToolHandler<MittwaldDatabaseRedisListArgs> = async (
  args,
  sessionId,
) => {
  if (!args.projectId) {
    return formatToolResponse('error', 'Project ID is required to list Redis databases.');
  }

  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_database_redis_list',
      argv,
      sessionId,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout ?? '';
    const stderr = result.result.stderr ?? '';
    const outputFormat = args.outputFormat ?? 'json';
    let databases: RedisDatabaseListItem[] | undefined;
    let parseError: string | undefined;

    if (outputFormat === 'json') {
      try {
        const parsed = parseJsonOutput(stdout || stderr);
        if (Array.isArray(parsed)) {
          databases = parsed.map((item: any) => ({
            id: item.id,
            name: item.name,
            description: item.description,
            version: item.version,
            hostname: item.hostname,
            persistent: item.configuration?.persistent ?? undefined,
            status: item.status,
            createdAt: item.createdAt,
          }));
        } else {
          parseError = 'Expected array output from Mittwald CLI.';
        }
      } catch (error) {
        parseError = error instanceof Error ? error.message : String(error);
        logger.error('[Redis List] Failed to parse CLI output as JSON', {
          projectId: args.projectId,
          error: parseError,
          stdout,
          stderr,
        });
      }
    }

    const message = databases && databases.length > 0
      ? `Found ${databases.length} Redis database(s) for project ${args.projectId}.`
      : `No Redis databases found for project ${args.projectId}.`;

    return formatToolResponse(
      'success',
      message,
      {
        projectId: args.projectId,
        format: outputFormat,
        databases,
        rawOutput: databases ? undefined : stdout || stderr || undefined,
        parseError,
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

    return formatToolResponse(
      'error',
      `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
