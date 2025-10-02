import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';

interface MittwaldBackupScheduleUpdateCliArgs {
  backupScheduleId: string;
  description?: string;
  schedule?: string;
  ttl?: string;
}

function buildCliArgs(args: MittwaldBackupScheduleUpdateCliArgs): string[] {
  const cliArgs: string[] = ['backup', 'schedule', 'update', args.backupScheduleId];

  if (args.description) cliArgs.push('--description', args.description);
  if (args.schedule) cliArgs.push('--schedule', args.schedule);
  if (args.ttl) cliArgs.push('--ttl', args.ttl);

  return cliArgs;
}

function mapCliError(error: CliToolError, args: MittwaldBackupScheduleUpdateCliArgs): string {
  const combined = `${error.stdout ?? ''}\n${error.stderr ?? ''}`.toLowerCase();

  if (combined.includes('not found') && combined.includes('schedule')) {
    return `Backup schedule not found. Please verify the schedule ID: ${args.backupScheduleId}.\nError: ${error.stderr || error.message}`;
  }

  if (combined.includes('invalid') && combined.includes('schedule')) {
    return `Invalid schedule format. Expected cron expression.\nError: ${error.stderr || error.message}`;
  }

  if (combined.includes('invalid') && combined.includes('ttl')) {
    return `Invalid TTL format. Expected format like '7d' (7-400 days).\nError: ${error.stderr || error.message}`;
  }

  return error.message;
}

export const handleBackupScheduleUpdateCli: MittwaldCliToolHandler<MittwaldBackupScheduleUpdateCliArgs> = async (args) => {
  if (!args.backupScheduleId) {
    return formatToolResponse('error', 'Backup schedule ID is required. Please provide the backupScheduleId parameter.');
  }

  if (!args.description && !args.schedule && !args.ttl) {
    return formatToolResponse('error', 'At least one field (description, schedule, ttl) must be provided to update.');
  }

  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_backup_schedule_update',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const output = result.result.stdout || result.result.stderr || '';
    const message = `Backup schedule ${args.backupScheduleId} updated successfully`;

    return formatToolResponse(
      'success',
      message,
      {
        backupScheduleId: args.backupScheduleId,
        description: args.description,
        schedule: args.schedule,
        ttl: args.ttl,
        output,
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

    return formatToolResponse('error', `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`);
  }
};
