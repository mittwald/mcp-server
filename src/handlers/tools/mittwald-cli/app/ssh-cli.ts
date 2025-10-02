import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';

interface MittwaldAppSshArgs {
  installationId?: string;
  sshUser?: string;
  sshIdentityFile?: string;
  cd?: boolean;
  info?: boolean;
  test?: boolean;
}

function buildCliArgs(args: MittwaldAppSshArgs, installationId: string): string[] {
  const cliArgs: string[] = ['app', 'ssh', installationId];

  if (args.sshUser) cliArgs.push('--ssh-user', args.sshUser);
  if (args.sshIdentityFile) cliArgs.push('--ssh-identity-file', args.sshIdentityFile);

  if (typeof args.cd === 'boolean') {
    cliArgs.push(args.cd ? '--cd' : '--no-cd');
  }

  if (args.info) cliArgs.push('--info');
  if (args.test) cliArgs.push('--test');

  return cliArgs;
}

function mapCliError(error: CliToolError, installationId: string): string {
  const combined = `${error.stdout ?? ''}\n${error.stderr ?? ''}`.toLowerCase();

  if (combined.includes('not found') && combined.includes('installation')) {
    return `App installation not found. Please verify the installation ID: ${installationId}.\nError: ${error.stderr || error.message}`;
  }

  if (combined.includes('ssh')) {
    return `SSH connection failed. Please check your SSH configuration and credentials.\nError: ${error.stderr || error.message}`;
  }

  return error.message;
}

export const handleAppSshCli: MittwaldCliToolHandler<MittwaldAppSshArgs> = async (args) => {
  if (!args.installationId) {
    return formatToolResponse('error', 'Installation ID is required. Please provide the installationId parameter.');
  }

  const argv = buildCliArgs(args, args.installationId);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_app_ssh',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
      cliOptions: {
        env: {
          MITTWALD_NONINTERACTIVE: '1',
        },
      },
    });

    const stdout = result.result.stdout || '';
    const stderr = result.result.stderr || '';
    const output = stdout || stderr || 'SSH operation completed';

    let message = 'SSH operation completed successfully';
    if (args.info) {
      message = 'SSH connection information retrieved';
    } else if (args.test) {
      message = 'SSH connection test completed successfully';
    }

    return formatToolResponse(
      'success',
      message,
      {
        installationId: args.installationId,
        sshUser: args.sshUser,
        sshIdentityFile: args.sshIdentityFile,
        cd: args.cd,
        info: args.info,
        test: args.test,
        output,
      },
      {
        command: result.meta.command,
        durationMs: result.meta.durationMs,
      }
    );
  } catch (error) {
    if (error instanceof CliToolError) {
      const message = mapCliError(error, args.installationId);
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
