import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';

interface MittwaldBackupDownloadCliArgs {
  backupId: string;
  format?: 'tar' | 'zip';
  output?: string;
  password?: string;
  generatePassword?: boolean;
  promptPassword?: boolean;
  resume?: boolean;
  quiet?: boolean;
}

function buildCliArgs(args: MittwaldBackupDownloadCliArgs): string[] {
  const cliArgs: string[] = ['backup', 'download', args.backupId];

  if (args.format) cliArgs.push('--format', args.format);
  if (args.output) cliArgs.push('--output', args.output);
  if (args.password) cliArgs.push('--password', args.password);
  if (args.generatePassword) cliArgs.push('--generate-password');
  if (args.promptPassword) cliArgs.push('--prompt-password');
  if (args.resume) cliArgs.push('--resume');
  if (args.quiet) cliArgs.push('--quiet');

  return cliArgs;
}

function mapCliError(error: CliToolError, args: MittwaldBackupDownloadCliArgs): string {
  const combined = `${error.stdout ?? ''}\n${error.stderr ?? ''}`.toLowerCase();

  if (combined.includes('not found') && combined.includes('backup')) {
    return `Backup not found. Please verify the backup ID: ${args.backupId}.\nError: ${error.stderr || error.message}`;
  }

  if (combined.includes('permission') || combined.includes('access')) {
    return `Permission denied. Please check your access rights.\nError: ${error.stderr || error.message}`;
  }

  if (combined.includes('file exists') || combined.includes('already exists')) {
    return `Output file already exists. Use --resume to resume the download or specify a different output file.\nError: ${error.stderr || error.message}`;
  }

  return error.message;
}

export const handleBackupDownloadCli: MittwaldCliToolHandler<MittwaldBackupDownloadCliArgs> = async (args) => {
  if (!args.backupId) {
    return formatToolResponse('error', 'Backup ID is required. Please provide the backupId parameter.');
  }

  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_backup_download',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout || '';
    const stderr = result.result.stderr || '';
    const output = stdout || stderr;
    const message = args.quiet
      ? output || `Backup ${args.backupId} downloaded successfully`
      : `Backup ${args.backupId} downloaded successfully`;

    return formatToolResponse(
      'success',
      message,
      {
        backupId: args.backupId,
        format: args.format ?? 'tar',
        outputPath: args.output,
        resume: args.resume,
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
