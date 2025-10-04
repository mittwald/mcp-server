import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { parseQuietOutput } from '../../../../utils/cli-output.js';
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
    for (const directory of args.directories) {
      cliArgs.push('--directories', directory);
    }
  }
  if (args.enable) cliArgs.push('--enable');
  if (args.disable) cliArgs.push('--disable');

  return cliArgs;
}

function mapCliError(error: CliToolError, args: MittwaldSftpUserUpdateArgs): string {
  const combined = `${error.stderr ?? ''}\n${error.stdout ?? ''}`.toLowerCase();
  const errorText = error.stderr || error.stdout || error.message;

  if (
    combined.includes('403') ||
    combined.includes('forbidden') ||
    combined.includes('permission denied')
  ) {
    return `Permission denied when updating SFTP user. Complete OAuth sign-in and ensure the Mittwald CLI is authenticated.\nError: ${errorText}`;
  }

  if (combined.includes('not found') && combined.includes('sftp user')) {
    return `SFTP user not found. Please verify the SFTP user ID: ${args.sftpUserId}.\nError: ${errorText}`;
  }

  if (combined.includes('invalid') && combined.includes('format')) {
    return `Invalid format in request. Please check your parameters.\nError: ${errorText}`;
  }

  return `Failed to update SFTP user: ${errorText}`;
}

export const handleSftpUserUpdateCli: MittwaldCliToolHandler<MittwaldSftpUserUpdateArgs> = async (args) => {
  if (!args.sftpUserId) {
    return formatToolResponse('error', 'SFTP user ID is required to update an SFTP user');
  }

  if (args.enable && args.disable) {
    return formatToolResponse('error', 'Cannot specify both --enable and --disable flags');
  }

  if (args.publicKey && args.password) {
    return formatToolResponse('error', 'Cannot specify both --public-key and --password (they are mutually exclusive)');
  }

  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_sftp_user_update',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout ?? '';
    const stderr = result.result.stderr ?? '';

    if (args.quiet) {
      const quietOutput = parseQuietOutput(stdout ?? '') || args.sftpUserId;
      return formatToolResponse(
        'success',
        quietOutput,
        {
          sftpUserId: args.sftpUserId,
          action: 'updated',
          output: stdout || stderr,
        },
        {
          command: result.meta.command,
          durationMs: result.meta.durationMs,
        }
      );
    }

    const updatedFields: string[] = [];
    if (args.description) updatedFields.push('description');
    if (args.expires) updatedFields.push('expires');
    if (args.publicKey) updatedFields.push('public key');
    if (args.password) updatedFields.push('password');
    if (args.accessLevel) updatedFields.push('access level');
    if (args.directories?.length) updatedFields.push('directories');
    if (args.enable) updatedFields.push('enabled');
    if (args.disable) updatedFields.push('disabled');

    return formatToolResponse(
      'success',
      `SFTP user ${args.sftpUserId} updated successfully`,
      {
        sftpUserId: args.sftpUserId,
        action: 'updated',
        updatedFields,
        output: stdout || stderr,
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

    return formatToolResponse(
      'error',
      `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
