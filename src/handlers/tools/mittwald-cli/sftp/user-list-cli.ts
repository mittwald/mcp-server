import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';

interface MittwaldSftpUserListArgs {
  projectId?: string;
  output?: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
  extended?: boolean;
  noHeader?: boolean;
  noTruncate?: boolean;
  noRelativeDates?: boolean;
  csvSeparator?: ',' | ';';
}

function buildCliArgs(args: MittwaldSftpUserListArgs): string[] {
  const cliArgs: string[] = ['sftp-user', 'list', '--output', 'json'];

  if (args.projectId) cliArgs.push('--project-id', args.projectId);
  if (args.extended) cliArgs.push('--extended');
  if (args.noHeader) cliArgs.push('--no-header');
  if (args.noTruncate) cliArgs.push('--no-truncate');
  if (args.noRelativeDates) cliArgs.push('--no-relative-dates');
  if (args.csvSeparator) cliArgs.push('--csv-separator', args.csvSeparator);

  return cliArgs;
}

function mapCliError(error: CliToolError, args: MittwaldSftpUserListArgs): string {
  const stderr = error.stderr ?? '';
  const stdout = error.stdout ?? '';
  const combined = `${stderr}\n${stdout}\n${error.message}`.toLowerCase();

  if (combined.includes('not found') && combined.includes('project')) {
    const details = stderr || stdout || error.message;
    return `Project not found. Please verify the project ID: ${args.projectId || 'not specified'}.\nError: ${details}`;
  }

  const details = stderr || stdout || error.message;
  return `Failed to list SFTP users: ${details}`;
}

function formatSftpUser(record: Record<string, unknown>) {
  return {
    id: record.id,
    description: record.description,
    accessLevel: record.accessLevel,
    projectId: record.projectId,
    directories: record.directories,
    expiresAt: record.expiresAt,
    active: record.active,
    data: record,
  };
}

export const handleSftpUserListCli: MittwaldCliToolHandler<MittwaldSftpUserListArgs> = async (args) => {
  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_sftp_user_list',
      argv,
      parser: (stdout) => stdout,
    });

    const commandMeta = {
      command: result.meta.command,
      durationMs: result.meta.durationMs,
    };

    const stdout = result.result ?? '';

    try {
      const parsed = JSON.parse(stdout);

      if (!Array.isArray(parsed)) {
        return formatToolResponse('error', 'Unexpected output format from CLI command');
      }

      if (parsed.length === 0) {
        return formatToolResponse('success', 'No SFTP users found', [], commandMeta);
      }

      const formatted = parsed.map((item) => formatSftpUser((item ?? {}) as Record<string, unknown>));

      return formatToolResponse(
        'success',
        `Found ${formatted.length} SFTP user(s)`,
        formatted,
        commandMeta
      );
    } catch (parseError) {
      return formatToolResponse(
        'success',
        'SFTP users retrieved (raw output)',
        {
          rawOutput: stdout,
          parseError: parseError instanceof Error ? parseError.message : String(parseError),
        },
        commandMeta
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
