import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';

interface MittwaldBackupScheduleListCliArgs {
  projectId?: string;
  output?: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
  extended?: boolean;
  noHeader?: boolean;
  noTruncate?: boolean;
  noRelativeDates?: boolean;
  csvSeparator?: ',' | ';';
}

type RawSchedule = {
  id?: string;
  projectId?: string;
  description?: string;
  schedule?: string;
  retention?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
};

function buildCliArgs(args: MittwaldBackupScheduleListCliArgs): string[] {
  const cliArgs: string[] = ['backup', 'schedule', 'list', '--output', 'json'];

  if (args.projectId) cliArgs.push('--project-id', args.projectId);
  if (args.extended) cliArgs.push('--extended');
  if (args.noHeader) cliArgs.push('--no-header');
  if (args.noTruncate) cliArgs.push('--no-truncate');
  if (args.noRelativeDates) cliArgs.push('--no-relative-dates');
  if (args.csvSeparator) cliArgs.push('--csv-separator', args.csvSeparator);

  return cliArgs;
}

function parseJsonOutput(output: string): RawSchedule[] | undefined {
  if (!output) return undefined;

  try {
    const data = JSON.parse(output);
    return Array.isArray(data) ? data : undefined;
  } catch {
    return undefined;
  }
}

function formatSchedules(schedules: RawSchedule[]) {
  return schedules.map((item) => ({
    id: item.id,
    projectId: item.projectId,
    description: item.description ?? 'No description',
    schedule: item.schedule,
    retention: item.retention,
    status: item.status,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }));
}

function mapCliError(error: CliToolError, args: MittwaldBackupScheduleListCliArgs): string {
  const combined = `${error.stdout ?? ''}\n${error.stderr ?? ''}`.toLowerCase();

  if (combined.includes('not found') && combined.includes('project')) {
    return `Project not found. Please verify the project ID: ${args.projectId ?? 'not specified'}.\nError: ${error.stderr || error.message}`;
  }

  return error.message;
}

export const handleBackupScheduleListCli: MittwaldCliToolHandler<MittwaldBackupScheduleListCliArgs> = async (args) => {
  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_backup_schedule_list',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout || '';
    const parsed = parseJsonOutput(stdout);

    if (!parsed) {
      return formatToolResponse(
        'success',
        'Backup schedules retrieved (raw output)',
        {
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
        'No backup schedules found',
        [],
        {
          command: result.meta.command,
          durationMs: result.meta.durationMs,
        }
      );
    }

    return formatToolResponse(
      'success',
      `Found ${parsed.length} backup schedule(s)`,
      formatSchedules(parsed),
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
