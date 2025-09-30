import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';

interface MittwaldBackupGetCliArgs {
  backupId: string;
  output?: 'txt' | 'json' | 'yaml';
}

function buildCliArgs(args: MittwaldBackupGetCliArgs): string[] {
  return ['backup', 'get', args.backupId, '--output', 'json'];
}

function parseJsonOutput(output: string): Record<string, unknown> | undefined {
  if (!output) return undefined;

  try {
    const data = JSON.parse(output);
    return typeof data === 'object' && data !== null ? data as Record<string, unknown> : undefined;
  } catch {
    return undefined;
  }
}

function mapCliError(error: CliToolError, args: MittwaldBackupGetCliArgs): string {
  const combined = `${error.stdout ?? ''}\n${error.stderr ?? ''}`.toLowerCase();

  if (combined.includes('not found') && combined.includes('backup')) {
    return `Backup not found. Please verify the backup ID: ${args.backupId}.\nError: ${error.stderr || error.message}`;
  }

  return error.message;
}

function formatBackupDetails(data: Record<string, unknown>) {
  return {
    id: data.id,
    projectId: data.projectId,
    description: data.description ?? 'No description',
    status: data.status,
    createdAt: data.createdAt,
    expiresAt: data.expiresAt,
    size: data.size ?? 'Unknown',
    format: data.format ?? 'Unknown',
  };
}

export const handleBackupGetCli: MittwaldCliToolHandler<MittwaldBackupGetCliArgs> = async (args) => {
  if (!args.backupId) {
    return formatToolResponse('error', 'Backup ID is required. Please provide the backupId parameter.');
  }

  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_backup_get',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout || '';
    const parsed = parseJsonOutput(stdout);

    if (!parsed) {
      return formatToolResponse(
        'success',
        'Backup details retrieved (raw output)',
        {
          backupId: args.backupId,
          rawOutput: stdout,
        },
        {
          command: result.meta.command,
          durationMs: result.meta.durationMs,
        }
      );
    }

    return formatToolResponse(
      'success',
      `Retrieved backup details for ${args.backupId}`,
      formatBackupDetails(parsed),
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
