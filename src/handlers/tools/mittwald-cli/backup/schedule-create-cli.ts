import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';

interface MittwaldBackupScheduleCreateCliArgs {
  projectId?: string;
  schedule: string;
  ttl: string;
  description?: string;
}

function buildCliArgs(args: MittwaldBackupScheduleCreateCliArgs): string[] {
  const cliArgs: string[] = ['backup', 'schedule', 'create', '--schedule', args.schedule, '--ttl', args.ttl];

  if (args.projectId) cliArgs.push('--project-id', args.projectId);
  if (args.description) cliArgs.push('--description', args.description);

  return cliArgs;
}


function mapCliError(error: CliToolError, args: MittwaldBackupScheduleCreateCliArgs): string {
  const combined = `${error.stdout ?? ''}\n${error.stderr ?? ''}`.toLowerCase();

  if (combined.includes('not found') && combined.includes('project')) {
    return `Project not found. Please verify the project ID: ${args.projectId ?? 'not specified'}.\nError: ${error.stderr || error.message}`;
  }

  if (combined.includes('invalid') && combined.includes('schedule')) {
    return `Invalid schedule format. Expected cron expression.\nError: ${error.stderr || error.message}`;
  }

  if (combined.includes('invalid') && combined.includes('ttl')) {
    return `Invalid TTL format. Expected format like '7d' (7-400 days).\nError: ${error.stderr || error.message}`;
  }

  return error.message;
}

function buildSuccessPayload(args: MittwaldBackupScheduleCreateCliArgs, output: string) {
  return {
    projectId: args.projectId,
    schedule: args.schedule,
    ttl: args.ttl,
    description: args.description,
    output,
  };
}

export const handleBackupScheduleCreateCli: MittwaldCliToolHandler<MittwaldBackupScheduleCreateCliArgs> = async (args) => {
  if (!args.schedule) {
    return formatToolResponse('error', "'schedule' is required. Please provide the schedule parameter.");
  }

  if (!args.ttl) {
    return formatToolResponse('error', "'ttl' is required. Please provide the ttl parameter.");
  }

  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_backup_schedule_create',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout || '';
    const stderr = result.result.stderr || '';
    const output = stdout || stderr || 'Backup schedule created successfully';

    return formatToolResponse(
      'success',
      'Backup schedule created successfully',
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
