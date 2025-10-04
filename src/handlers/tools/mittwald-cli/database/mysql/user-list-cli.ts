import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { parseJsonOutput } from '@/utils/cli-output.js';
import { logger } from '../../../../../utils/logger.js';
import { invokeCliTool, CliToolError } from '@/tools/index.js';

interface MittwaldDatabaseMysqlUserListArgs {
  databaseId: string;
  outputFormat?: 'json' | 'yaml' | 'txt' | 'csv' | 'tsv';
  extended?: boolean;
  noHeader?: boolean;
  noTruncate?: boolean;
  noRelativeDates?: boolean;
  csvSeparator?: ',' | ';';
}

interface MysqlUserListItem {
  id: string;
  name?: string;
  description?: string;
  mainUser?: boolean;
  accessLevel?: string;
  externalAccess?: boolean;
  disabled?: boolean;
  createdAt?: string;
}

function buildCliArgs(args: MittwaldDatabaseMysqlUserListArgs): string[] {
  const cliArgs: string[] = [
    'database',
    'mysql',
    'user',
    'list',
    '--database-id',
    args.databaseId,
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

function mapCliError(error: CliToolError, args: MittwaldDatabaseMysqlUserListArgs): string {
  const combined = `${error.stderr ?? ''}\n${error.stdout ?? ''}`.toLowerCase();
  const message = error.stderr || error.stdout || error.message;

  if (combined.includes('permission denied') || combined.includes('forbidden') || combined.includes('401')) {
    return `Permission denied while listing MySQL users. Re-authenticate and ensure the Mittwald CLI session is valid.\nError: ${message}`;
  }

  if (combined.includes('database') && combined.includes('not found')) {
    return `MySQL database not found. Verify the database ID: ${args.databaseId}.\nError: ${message}`;
  }

  return `Failed to list MySQL users: ${message}`;
}

/**
 * Handle listing MySQL users for a database through the Mittwald CLI wrapper.
 */
export const handleDatabaseMysqlUserListCli: MittwaldCliToolHandler<MittwaldDatabaseMysqlUserListArgs> = async (
  args,
  sessionId,
) => {
  if (!args.databaseId) {
    return formatToolResponse('error', 'Database ID is required to list MySQL users.');
  }

  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_database_mysql_user_list',
      argv,
      sessionId,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout ?? '';
    const stderr = result.result.stderr ?? '';
    const outputFormat = args.outputFormat ?? 'json';
    let users: MysqlUserListItem[] | undefined;
    let parseError: string | undefined;

    if (outputFormat === 'json') {
      try {
        const parsed = parseJsonOutput(stdout || stderr);
        if (Array.isArray(parsed)) {
          users = parsed.map((item: any) => ({
            id: item.id,
            name: item.name,
            description: item.description,
            mainUser: Boolean(item.mainUser),
            accessLevel: item.accessLevel,
            externalAccess: Boolean(item.externalAccess),
            disabled: Boolean(item.disabled),
            createdAt: item.createdAt,
          }));
        } else {
          parseError = 'Expected array output from Mittwald CLI.';
        }
      } catch (error) {
        parseError = error instanceof Error ? error.message : String(error);
        logger.error('[MySQL User List] Failed to parse CLI output as JSON', {
          databaseId: args.databaseId,
          error: parseError,
          stdout,
          stderr,
        });
      }
    }

    const message = users && users.length > 0
      ? `Found ${users.length} MySQL user(s) for database ${args.databaseId}.`
      : `No MySQL users found for database ${args.databaseId}.`;

    return formatToolResponse(
      'success',
      message,
      {
        databaseId: args.databaseId,
        format: outputFormat,
        users,
        rawOutput: users ? undefined : stdout || stderr || undefined,
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
