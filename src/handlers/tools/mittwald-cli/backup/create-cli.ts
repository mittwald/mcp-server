import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';

interface MittwaldBackupCreateCliArgs {
  projectId?: string;
  expires: string;
  description?: string;
  quiet?: boolean;
  wait?: boolean;
  waitTimeout?: string;
}

function buildCliArgs(args: MittwaldBackupCreateCliArgs): string[] {
  const cliArgs: string[] = ['backup', 'create', '--expires', args.expires];

  if (args.projectId) cliArgs.push('--project-id', args.projectId);
  if (args.description) cliArgs.push('--description', args.description);
  if (args.quiet) cliArgs.push('--quiet');
  if (args.wait) cliArgs.push('--wait');
  if (args.waitTimeout) cliArgs.push('--wait-timeout', args.waitTimeout);

  return cliArgs;
}

function parseQuietOutput(output: string): string | undefined {
  const trimmed = output.trim();
  if (!trimmed) return undefined;
  const lines = trimmed.split(/\r?\n/);
  return lines.at(-1);
}

function mapCliError(error: CliToolError, args: MittwaldBackupCreateCliArgs): string {
  const combined = `${error.stdout ?? ''}\n${error.stderr ?? ''}`.toLowerCase();

  if (combined.includes('not found') && combined.includes('project')) {
    return `Project not found. Please verify the project ID: ${args.projectId ?? 'not specified'}.\nError: ${error.stderr || error.message}`;
  }

  if (combined.includes('invalid') && combined.includes('expires')) {
    return `Invalid expires format. Expected format like '30d', '1y', or '30m'.\nError: ${error.stderr || error.message}`;
  }

  return error.message;
}

function buildSuccessPayload(args: MittwaldBackupCreateCliArgs, output: string, backupId?: string) {
  return {
    backupId,
    projectId: args.projectId,
    expires: args.expires,
    description: args.description,
    wait: args.wait,
    output,
  };
}

export const handleBackupCreateCli: MittwaldCliToolHandler<MittwaldBackupCreateCliArgs> = async (args) => {
  if (!args.expires) {
    return formatToolResponse('error', "'expires' is required. Please provide the expires parameter.");
  }

  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_backup_create',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout || '';
    const stderr = result.result.stderr || '';
    const output = stdout || stderr || 'Backup creation initiated';

    if (args.quiet) {
      const backupId = parseQuietOutput(stdout);
      return formatToolResponse(
        'success',
        backupId ? `Backup created successfully with ID: ${backupId}` : output,
        buildSuccessPayload(args, output, backupId),
        {
          command: result.meta.command,
          durationMs: result.meta.durationMs,
        }
      );
    }

    const message = args.wait
      ? 'Backup created successfully'
      : 'Backup creation initiated';

    return formatToolResponse(
      'success',
      message,
      buildSuccessPayload(args, output),
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

    return formatToolResponse('error', `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`);
  }
};
