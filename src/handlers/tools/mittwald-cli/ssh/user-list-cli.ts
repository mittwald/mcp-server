import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';

interface MittwaldSshUserListArgs {
  projectId?: string;
  output?: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
  extended?: boolean;
  noHeader?: boolean;
  noTruncate?: boolean;
  noRelativeDates?: boolean;
  csvSeparator?: ',' | ';';
}

function buildCliArgs(args: MittwaldSshUserListArgs): string[] {
  const cliArgs: string[] = ['ssh-user', 'list', '--output', 'json'];

  if (args.projectId) cliArgs.push('--project-id', args.projectId);
  if (args.extended) cliArgs.push('--extended');
  if (args.noHeader) cliArgs.push('--no-header');
  if (args.noTruncate) cliArgs.push('--no-truncate');
  if (args.noRelativeDates) cliArgs.push('--no-relative-dates');
  if (args.csvSeparator) cliArgs.push('--csv-separator', args.csvSeparator);

  return cliArgs;
}

function mapCliError(error: CliToolError, args: MittwaldSshUserListArgs): string {
  const stderr = error.stderr ?? '';
  const stdout = error.stdout ?? '';
  const combined = `${stderr}\n${stdout}\n${error.message}`.toLowerCase();

  if (combined.includes('not found') && combined.includes('project')) {
    const details = stderr || stdout || error.message;
    return `Project not found. Please verify the project ID: ${args.projectId || 'not specified'}.\nError: ${details}`;
  }

  const details = stderr || stdout || error.message;
  return `Failed to list SSH users: ${details}`;
}

function formatSshUser(record: Record<string, unknown>) {
  return {
    id: record.id,
    description: record.description,
    active: record.active,
    projectId: record.projectId,
    authentication: record.authentication,
    expiresAt: record.expiresAt,
    data: record,
  };
}

export const handleSshUserListCli: MittwaldCliToolHandler<MittwaldSshUserListArgs> = async (args) => {
  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_ssh_user_list',
      argv,
      parser: (stdout) => stdout,
    });

    const meta = {
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
        return formatToolResponse('success', 'No SSH users found', [], meta);
      }

      const formatted = parsed.map((item) => formatSshUser((item ?? {}) as Record<string, unknown>));

      return formatToolResponse(
        'success',
        `Found ${formatted.length} SSH user(s)`,
        formatted,
        meta
      );
    } catch (parseError) {
      return formatToolResponse(
        'success',
        'SSH users retrieved (raw output)',
        {
          rawOutput: stdout,
          parseError: parseError instanceof Error ? parseError.message : String(parseError),
        },
        meta
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
