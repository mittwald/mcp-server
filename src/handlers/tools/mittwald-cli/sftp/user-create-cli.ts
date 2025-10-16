import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';
import { buildSecureToolResponse } from '../../../../utils/credential-response.js';

interface MittwaldSftpUserCreateArgs {
  projectId?: string;
  description: string;
  directories: string[];
  expires?: string;
  publicKey?: string;
  password?: string;
  accessLevel?: 'read' | 'full';
}

function buildCliArgs(args: MittwaldSftpUserCreateArgs): string[] {
  const cliArgs: string[] = ['sftp-user', 'create', '--description', args.description];

  for (const directory of args.directories) {
    cliArgs.push('--directories', directory);
  }
  if (args.projectId) cliArgs.push('--project-id', args.projectId);
  if (args.expires) cliArgs.push('--expires', args.expires);
  if (args.accessLevel) cliArgs.push('--access-level', args.accessLevel);
  if (args.publicKey) cliArgs.push('--public-key', args.publicKey);
  if (args.password) cliArgs.push('--password', args.password);

  return cliArgs;
}

function extractSftpUserId(output: string): string | undefined {
  const match = output.match(/(sftp-[a-z0-9]+)/i);
  return match ? match[1] : undefined;
}

function mapCliError(error: CliToolError, args: MittwaldSftpUserCreateArgs): string {
  const stderr = error.stderr ?? '';
  const stdout = error.stdout ?? '';
  const combined = `${stderr}\n${stdout}\n${error.message}`.toLowerCase();

  if (combined.includes('forbidden') || combined.includes('permission denied') || combined.includes('403')) {
    return `Permission denied when creating SFTP user. Complete OAuth sign-in and ensure the Mittwald CLI is authenticated.\nError: ${stderr || stdout || error.message}`;
  }

  if (combined.includes('not found') && combined.includes('project')) {
    return `Project not found. Please verify the project ID: ${args.projectId || 'not specified'}.\nError: ${stderr || stdout || error.message}`;
  }

  if (combined.includes('invalid') && combined.includes('format')) {
    return `Invalid format in request. Please check your parameters.\nError: ${stderr || stdout || error.message}`;
  }

  return `Failed to create SFTP user: ${stderr || stdout || error.message}`;
}

export const handleSftpUserCreateCli: MittwaldCliToolHandler<MittwaldSftpUserCreateArgs> = async (
  args,
  sessionId,
) => {
  if (!args.description) {
    return buildSecureToolResponse('error', 'Description is required to create an SFTP user');
  }

  if (!args.directories || args.directories.length === 0) {
    return buildSecureToolResponse('error', 'At least one directory must be specified');
  }

  if (args.password && args.publicKey) {
    return buildSecureToolResponse('error', 'Cannot specify both password and public key authentication. Choose one.');
  }

  if (!args.password && !args.publicKey) {
    return buildSecureToolResponse('error', 'Either password or public key must be specified for authentication');
  }

  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_sftp_user_create',
      argv,
      sessionId,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout ?? '';
    const sftpUserId = extractSftpUserId(stdout);

    const authentication = {
      method: args.publicKey ? 'publicKey' : 'password',
      passwordProvided: Boolean(args.password),
      publicKeyProvided: Boolean(args.publicKey),
    };

    const responseData = {
      id: sftpUserId,
      description: args.description,
      directories: args.directories,
      accessLevel: args.accessLevel ?? 'read',
      authentication,
      projectId: args.projectId,
      expires: args.expires,
    };

    const message = sftpUserId
      ? `Successfully created SFTP user '${args.description}' with ID ${sftpUserId}`
      : `Successfully created SFTP user '${args.description}'`;

    return buildSecureToolResponse(
      'success',
      message,
      responseData,
      {
        command: result.meta.command,
        durationMs: result.meta.durationMs,
      }
    );
  } catch (error) {
    if (error instanceof CliToolError) {
      const message = mapCliError(error, args);
      return buildSecureToolResponse('error', message, {
        exitCode: error.exitCode,
        stderr: error.stderr,
        stdout: error.stdout,
        suggestedAction: error.suggestedAction,
      });
    }

    return buildSecureToolResponse(
      'error',
      `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
