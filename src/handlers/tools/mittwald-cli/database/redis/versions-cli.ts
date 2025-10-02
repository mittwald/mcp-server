import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { parseJsonOutput } from '../../../../../utils/cli-wrapper.js';
import { logger } from '../../../../../utils/logger.js';
import { invokeCliTool, CliToolError } from '../../../../../tools/index.js';

interface MittwaldDatabaseRedisVersionsArgs {
  projectId?: string;
  outputFormat?: 'json' | 'yaml' | 'txt' | 'csv' | 'tsv';
  extended?: boolean;
  noHeader?: boolean;
  noTruncate?: boolean;
  noRelativeDates?: boolean;
  csvSeparator?: ',' | ';';
}

interface RedisVersionListItem {
  id: string;
  name?: string;
  version?: string;
}

function buildCliArgs(args: MittwaldDatabaseRedisVersionsArgs): string[] {
  const cliArgs: string[] = ['database', 'redis', 'versions', '--output', args.outputFormat ?? 'json'];

  if (args.projectId) cliArgs.push('--project-id', args.projectId);
  if (args.extended) cliArgs.push('--extended');
  if (args.noHeader) cliArgs.push('--no-header');
  if (args.noTruncate) cliArgs.push('--no-truncate');
  if (args.noRelativeDates) cliArgs.push('--no-relative-dates');
  if (args.csvSeparator) cliArgs.push('--csv-separator', args.csvSeparator);

  return cliArgs;
}

function mapCliError(error: CliToolError): string {
  const combined = `${error.stderr ?? ''}\n${error.stdout ?? ''}`.toLowerCase();
  const message = error.stderr || error.stdout || error.message;

  if (combined.includes('permission denied') || combined.includes('forbidden') || combined.includes('401')) {
    return `Permission denied while listing Redis versions. Re-authenticate and ensure the Mittwald CLI session is valid.\nError: ${message}`;
  }

  return `Failed to list Redis versions: ${message}`;
}

/**
 * Handle listing Redis versions available for deployment via the Mittwald CLI wrapper.
 */
export const handleDatabaseRedisVersionsCli: MittwaldCliToolHandler<MittwaldDatabaseRedisVersionsArgs> = async (
  args,
  sessionId,
) => {
  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_database_redis_versions',
      argv,
      sessionId,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout ?? '';
    const stderr = result.result.stderr ?? '';
    const outputFormat = args.outputFormat ?? 'json';
    let versions: RedisVersionListItem[] | undefined;
    let parseError: string | undefined;

    if (outputFormat === 'json') {
      try {
        const parsed = parseJsonOutput(stdout || stderr);
        if (Array.isArray(parsed)) {
          versions = parsed.map((item: any) => ({
            id: item.id,
            name: item.name,
            version: item.number ?? item.version,
          }));
        } else {
          parseError = 'Expected array output from Mittwald CLI.';
        }
      } catch (error) {
        parseError = error instanceof Error ? error.message : String(error);
        logger.error('[Redis Versions] Failed to parse CLI output as JSON', {
          projectId: args.projectId,
          error: parseError,
          stdout,
          stderr,
        });
      }
    }

    const message = versions && versions.length > 0
      ? `Found ${versions.length} Redis version(s).`
      : 'No Redis versions available.';

    return formatToolResponse(
      'success',
      message,
      {
        projectId: args.projectId,
        format: outputFormat,
        versions,
        rawOutput: versions ? undefined : stdout || stderr || undefined,
        parseError,
      },
      {
        command: result.meta.command,
        durationMs: result.meta.durationMs,
      }
    );
  } catch (error) {
    if (error instanceof CliToolError) {
      const message = mapCliError(error);
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
