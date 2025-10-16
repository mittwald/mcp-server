import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { parseJsonOutput } from '@/utils/cli-output.js';
import { logger } from '../../../../../utils/logger.js';
import { invokeCliTool, CliToolError } from '@/tools/index.js';

interface MittwaldDatabaseMysqlUserGetArgs {
  userId: string;
  outputFormat?: 'json' | 'yaml' | 'txt';
}

interface MysqlUserDetails {
  id: string;
  name?: string;
  description?: string;
  databaseId?: string;
  accessLevel?: string;
  externalAccess?: boolean;
  accessIpMask?: string | null;
  createdAt?: string;
  updatedAt?: string;
  mainUser?: boolean;
  disabled?: boolean;
}

function buildCliArgs(args: MittwaldDatabaseMysqlUserGetArgs): string[] {
  const format = args.outputFormat ?? 'json';
  return ['database', 'mysql', 'user', 'get', args.userId, '--output', format];
}

function mapCliError(error: CliToolError, args: MittwaldDatabaseMysqlUserGetArgs): string {
  const combined = `${error.stderr ?? ''}\n${error.stdout ?? ''}`.toLowerCase();
  const message = error.stderr || error.stdout || error.message;

  if (combined.includes('permission denied') || combined.includes('forbidden') || combined.includes('401')) {
    return `Permission denied while retrieving MySQL user. Re-authenticate and ensure the Mittwald CLI session is valid.\nError: ${message}`;
  }

  if (combined.includes('not found') || combined.includes('404')) {
    return `MySQL user not found. Verify the user ID: ${args.userId}.\nError: ${message}`;
  }

  return `Failed to retrieve MySQL user: ${message}`;
}

/**
 * Handle retrieval of MySQL user details through the Mittwald CLI wrapper.
 */
export const handleDatabaseMysqlUserGetCli: MittwaldCliToolHandler<MittwaldDatabaseMysqlUserGetArgs> = async (
  args,
  sessionId,
) => {
  if (!args.userId) {
    return formatToolResponse('error', 'User ID is required to fetch MySQL user details.');
  }

  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_database_mysql_user_get',
      argv,
      sessionId,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout ?? '';
    const stderr = result.result.stderr ?? '';
    const outputFormat = args.outputFormat ?? 'json';
    let details: MysqlUserDetails | undefined;
    let parseError: string | undefined;

    if (outputFormat === 'json') {
      try {
        const parsed = parseJsonOutput(stdout || stderr);
        if (parsed && typeof parsed === 'object') {
          details = parsed as MysqlUserDetails;
        } else {
          parseError = 'Unexpected JSON structure returned by Mittwald CLI.';
        }
      } catch (error) {
        parseError = error instanceof Error ? error.message : String(error);
        logger.error('[MySQL User Get] Failed to parse CLI output as JSON', {
          userId: args.userId,
          error: parseError,
          stdout,
          stderr,
        });
      }
    }

    return formatToolResponse(
      'success',
      `Retrieved MySQL user ${args.userId}.`,
      {
        userId: args.userId,
        format: outputFormat,
        user: details,
        rawOutput: details ? undefined : stdout || stderr || undefined,
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
