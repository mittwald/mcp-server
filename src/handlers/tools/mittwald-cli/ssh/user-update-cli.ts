import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';

interface MittwaldSshUserUpdateArgs {
  sshUserId: string;
  expires?: string;
  description?: string;
  publicKey?: string;
  password?: string;
  enable?: boolean;
  disable?: boolean;
}

function buildCliArgs(args: MittwaldSshUserUpdateArgs): string[] {
  const cliArgs: string[] = ['ssh-user', 'update', args.sshUserId];

  if (args.expires) cliArgs.push('--expires', args.expires);
  if (args.description) cliArgs.push('--description', args.description);
  if (args.publicKey) cliArgs.push('--public-key', args.publicKey);
  if (args.password) cliArgs.push('--password', args.password);
  if (args.enable) cliArgs.push('--enable');
  if (args.disable) cliArgs.push('--disable');

  return cliArgs;
}


function collectUpdatedFields(args: MittwaldSshUserUpdateArgs): string[] {
  const fields: string[] = [];
  if (args.description) fields.push('description');
  if (args.expires) fields.push('expires');
  if (args.publicKey) fields.push('public key');
  if (args.password) fields.push('password');
  if (args.enable) fields.push('enabled');
  if (args.disable) fields.push('disabled');
  return fields;
}

function mapCliError(error: CliToolError, args: MittwaldSshUserUpdateArgs): string {
  const stderr = error.stderr ?? '';
  const stdout = error.stdout ?? '';
  const combined = `${stderr}\n${stdout}\n${error.message}`.toLowerCase();

  if (combined.includes('403') || combined.includes('forbidden') || combined.includes('permission denied')) {
    const details = stderr || stdout || error.message;
    return `Permission denied when updating SSH user. Complete OAuth sign-in and ensure the Mittwald CLI is authenticated.\nError: ${details}`;
  }

  if (combined.includes('not found') && combined.includes('ssh user')) {
    const details = stderr || stdout || error.message;
    return `SSH user not found. Please verify the SSH user ID: ${args.sshUserId}.\nError: ${details}`;
  }

  if (combined.includes('invalid') && combined.includes('format')) {
    const details = stderr || stdout || error.message;
    return `Invalid format in request. Please check your parameters.\nError: ${details}`;
  }

  const details = stderr || stdout || error.message;
  return `Failed to update SSH user: ${details}`;
}

export const handleSshUserUpdateCli: MittwaldCliToolHandler<MittwaldSshUserUpdateArgs> = async (args) => {
  if (!args.sshUserId) {
    return formatToolResponse('error', 'SSH user ID is required to update an SSH user');
  }

  if (args.enable && args.disable) {
    return formatToolResponse('error', 'Cannot specify both --enable and --disable flags');
  }

  if (args.publicKey && args.password) {
    return formatToolResponse('error', 'Cannot specify both --public-key and --password (they are mutually exclusive)');
  }

  const argv = buildCliArgs(args);
  const updatedFields = collectUpdatedFields(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_ssh_user_update',
      argv,
      parser: (stdout) => stdout,
    });

    const meta = {
      command: result.meta.command,
      durationMs: result.meta.durationMs,
    };

    const stdout = result.result ?? '';

    return formatToolResponse(
      'success',
      `SSH user ${args.sshUserId} updated successfully`,
      {
        sshUserId: args.sshUserId,
        action: 'updated',
        updatedFields,
        output: stdout,
      },
      meta
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
