import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';

interface MittwaldAppDownloadArgs {
  installationId?: string;
  target: string;
  quiet?: boolean;
  sshUser?: string;
  sshIdentityFile?: string;
  exclude?: string[];
  dryRun?: boolean;
  delete?: boolean;
  remoteSubDirectory?: string;
}

function buildCliArgs(args: MittwaldAppDownloadArgs): string[] {
  const cliArgs: string[] = ['app', 'download'];
  cliArgs.push(args.installationId!);
  cliArgs.push('--target', args.target);

  if (args.quiet) {
    cliArgs.push('--quiet');
  }
  if (args.sshUser) {
    cliArgs.push('--ssh-user', args.sshUser);
  }
  if (args.sshIdentityFile) {
    cliArgs.push('--ssh-identity-file', args.sshIdentityFile);
  }
  if (Array.isArray(args.exclude)) {
    for (const pattern of args.exclude) {
      cliArgs.push('--exclude', pattern);
    }
  }
  if (args.dryRun) {
    cliArgs.push('--dry-run');
  }
  if (args.delete) {
    cliArgs.push('--delete');
  }
  if (args.remoteSubDirectory) {
    cliArgs.push('--remote-sub-directory', args.remoteSubDirectory);
  }

  return cliArgs;
}

function mapCliToolError(error: CliToolError, installationId?: string): string {
  const stderr = (error.stderr || '').toLowerCase();
  if (stderr.includes('not found') && stderr.includes('installation')) {
    return `App installation not found. Please verify the installation ID: ${installationId}.\nError: ${error.stderr || error.message}`;
  }
  if (stderr.includes('rsync')) {
    return `rsync is required but not available. Please install rsync on your system.\nError: ${error.stderr || error.message}`;
  }
  return error.message;
}

export const handleAppDownloadCli: MittwaldCliToolHandler<MittwaldAppDownloadArgs> = async (args) => {
  if (!args.installationId) {
    return formatToolResponse('error', 'Installation ID is required. Please provide the installationId parameter.');
  }
  if (!args.target) {
    return formatToolResponse('error', 'Target directory is required. Please provide the target parameter.');
  }

  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_app_download',
      argv,
      cliOptions: { timeout: 300_000 },
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const message = args.dryRun ? 'Dry run completed successfully' : 'App downloaded successfully';
    return formatToolResponse('success', message, {
      installationId: args.installationId,
      target: args.target,
      remoteSubDirectory: args.remoteSubDirectory,
      dryRun: args.dryRun,
      output: result.result.stdout || result.result.stderr,
    }, {
      command: result.meta.command,
      durationMs: result.meta.durationMs,
    });
  } catch (error) {
    if (error instanceof CliToolError) {
      const message = mapCliToolError(error, args.installationId);
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
