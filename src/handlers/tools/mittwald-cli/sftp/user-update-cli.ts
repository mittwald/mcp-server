import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';

interface MittwaldSftpUserUpdateArgs {
  sftpUserId: string;
  quiet?: boolean;
  expires?: string;
  description?: string;
  publicKey?: string;
  password?: string;
  accessLevel?: 'read' | 'full';
  directories?: string[];
  enable?: boolean;
  disable?: boolean;
}

function buildCliArgs(args: MittwaldSftpUserUpdateArgs): string[] {
  const cliArgs: string[] = ['sftp-user', 'update', args.sftpUserId];

  if (args.quiet) cliArgs.push('--quiet');
  if (args.expires) cliArgs.push('--expires', args.expires);
  if (args.description) cliArgs.push('--description', args.description);
  if (args.publicKey) cliArgs.push('--public-key', args.publicKey);
  if (args.password) cliArgs.push('--password', args.password);
  if (args.accessLevel) cliArgs.push('--access-level', args.accessLevel);
  if (args.directories) {
    for (const directory of args.directories) cliArgs.push('--directories', directory);
  }
  if (args.enable) cliArgs.push('--enable');
  if (args.disable) cliArgs.push('--disable');

  return cliArgs;
}

function parseQuietOutput(output: string): string | undefined {
  const trimmed = output.trim();
  if (!trimmed) return undefined;
  const lines = trimmed.split(/\r?\n/);
  return lines.at(-1);
}

function mapCliError(error: CliToolError, args: MittwaldSftpUserUpdateArgs): string {
  const stderr = error.stderr ?? '';
  const stdout = error.stdout ?? '';
  const combined = `${stderr}\n${stdout}\n${error.message}`.toLowerCase();

  if (combined.includes('forbidden') || combined.includes('permission denied') || combined.includes('403')) {
    const details = stderr || stdout || error.message;
    return `Permission denied when updating SFTP user. Complete OAuth sign-in and ensure the Mittwald CLI is authenticated.\nError: ${details}`;
  }

  if (combined.includes('not found') && combined.includes('sftp user')) {
    const details = stderr || stdout || error.message;
    return `SFTP user not found. Please verify the SFTP user ID: ${args.sftpUserId}.\nError: ${details}`;
  }

  if (combined.includes('invalid') && combined.includes('format')) {
    const details = stderr || stdout || error.message;
    return `Invalid format in request. Please check your parameters.\nError: ${details}`;
  }

  const details = stderr || stdout || error.message;
  return `Failed to update SFTP user: ${details}`;
}

function buildUpdatedFields(args: MittwaldSftpUserUpdateArgs): string[] {
  const updated: string[] = [];
  if (args.description) updated.push('description');
  if (args.expires) updated.push('expires');
  if (args.publicKey) updated.push('public key');
  if (args.password) updated.push('password');
  if (args.accessLevel) updated.push('access level');
  if (args.directories) updated.push('directories');
  if (args.enable) updated.push('enabled');
  if (args.disable) updated.push('disabled');
  return updated;
}

export const handleSftpUserUpdateCli: MittwaldCliToolHandler<MittwaldSftpUserUpdateArgs> = async (args) => {
  try {
    if (!args.sftpUserId) {
      return formatToolResponse(
        "error",
        "SFTP user ID is required to update an SFTP user"
      );
    }
    
    // Validate mutually exclusive options
    if (args.enable && args.disable) {
      return formatToolResponse(
        "error",
        "Cannot specify both --enable and --disable flags"
      );
    }

    if (args.publicKey && args.password) {
      return formatToolResponse(
        "error",
        "Cannot specify both --public-key and --password (they are mutually exclusive)"
      );
    }
    

    const argv = buildCliArgs(args);

    const result = await invokeCliTool({
      toolName: 'mittwald_sftp_user_update',
      argv,
      parser: (stdout) => stdout,
    });

    const commandMeta = {
      command: result.meta.command,
      durationMs: result.meta.durationMs,
    };

    const stdout = result.result ?? '';

    if (args.quiet) {
      const quietOutput = parseQuietOutput(stdout);
      return formatToolResponse(
        'success',
        quietOutput || args.sftpUserId,
        {
          sftpUserId: args.sftpUserId,
          action: 'updated',
          output: stdout,
        },
        commandMeta
      );
    }

    return formatToolResponse(
      'success',
      `SFTP user ${args.sftpUserId} updated successfully`,
      {
        sftpUserId: args.sftpUserId,
        action: 'updated',
        updatedFields: buildUpdatedFields(args),
        output: stdout,
      },
      commandMeta
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
