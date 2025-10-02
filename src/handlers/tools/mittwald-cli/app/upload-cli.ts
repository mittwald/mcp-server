import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';

interface MittwaldAppUploadArgs {
  installationId?: string;
  source: string;
  sshUser?: string;
  sshIdentityFile?: string;
  exclude?: string[];
  dryRun?: boolean;
  delete?: boolean;
  remoteSubDirectory?: string;
}

function buildCliArgs(args: MittwaldAppUploadArgs, installationId: string): string[] {
  const cliArgs: string[] = ['app', 'upload', installationId, '--source', args.source];

  if (args.sshUser) cliArgs.push('--ssh-user', args.sshUser);
  if (args.sshIdentityFile) cliArgs.push('--ssh-identity-file', args.sshIdentityFile);
  if (Array.isArray(args.exclude)) {
    for (const pattern of args.exclude) {
      cliArgs.push('--exclude', pattern);
    }
  }
  if (args.dryRun) cliArgs.push('--dry-run');
  if (args.delete) cliArgs.push('--delete');
  if (args.remoteSubDirectory) cliArgs.push('--remote-sub-directory', args.remoteSubDirectory);

  return cliArgs;
}

function mapCliError(error: CliToolError, args: MittwaldAppUploadArgs): string {
  const combined = `${error.stdout ?? ''}\n${error.stderr ?? ''}`.toLowerCase();

  if (combined.includes('not found') && combined.includes('installation')) {
    return `App installation not found. Please verify the installation ID: ${args.installationId}.\nError: ${error.stderr || error.message}`;
  }

  if (combined.includes('rsync')) {
    return `rsync is required but not available. Please install rsync on your system.\nError: ${error.stderr || error.message}`;
  }

  if (combined.includes('source') && combined.includes('not found')) {
    return `Source directory not found: ${args.source}.\nError: ${error.stderr || error.message}`;
  }

  return error.message;
}

function buildSuccessMessage(args: MittwaldAppUploadArgs): string {
  if (args.dryRun) return 'Dry run completed successfully';
  return 'App uploaded successfully';
}


export const handleAppUploadCli: MittwaldCliToolHandler<MittwaldAppUploadArgs> = async (args) => {
  if (!args.installationId) {
    return formatToolResponse('error', 'Installation ID is required. Please provide the installationId parameter.');
  }

  if (!args.source) {
    return formatToolResponse('error', 'Source directory is required. Please provide the source parameter.');
  }

  const argv = buildCliArgs(args, args.installationId);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_app_upload',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
      cliOptions: {
        timeout: 600000,
        env: {
          MITTWALD_NONINTERACTIVE: '1',
        },
      },
    });

    const stdout = result.result.stdout || '';
    const stderr = result.result.stderr || '';
    const output = stdout || stderr || 'App uploaded successfully';
    const message = buildSuccessMessage(args);

    return formatToolResponse(
      'success',
      message,
      {
        installationId: args.installationId,
        source: args.source,
        remoteSubDirectory: args.remoteSubDirectory,
        dryRun: args.dryRun,
        delete: args.delete,
        sshUser: args.sshUser,
        sshIdentityFile: args.sshIdentityFile,
        exclude: args.exclude,
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
