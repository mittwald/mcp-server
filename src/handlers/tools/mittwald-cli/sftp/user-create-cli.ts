import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';

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

  for (const directory of args.directories) cliArgs.push('--directories', directory);
  if (args.projectId) cliArgs.push('--project-id', args.projectId);
  if (args.expires) cliArgs.push('--expires', args.expires);
  if (args.accessLevel) cliArgs.push('--access-level', args.accessLevel);
  if (args.publicKey) cliArgs.push('--public-key', args.publicKey);
  if (args.password) cliArgs.push('--password', args.password);

  return cliArgs;
}

function extractSftpUserId(output: string): string | undefined {
  const match = output.match(/ID\s+([a-z0-9-]+)/i);
  if (match) return match[1];
  return undefined;
}

function mapCliError(error: CliToolError, args: MittwaldSftpUserCreateArgs): string {
  const stderr = error.stderr ?? '';
  const stdout = error.stdout ?? '';
  const combined = `${stderr}\n${stdout}\n${error.message}`.toLowerCase();

  if (combined.includes('forbidden') || combined.includes('permission denied') || combined.includes('403')) {
    const details = stderr || stdout || error.message;
    return `Permission denied when creating SFTP user. Complete OAuth sign-in and ensure the Mittwald CLI is authenticated.\nError: ${details}`;
  }

  if (combined.includes('not found') && combined.includes('project')) {
    const details = stderr || stdout || error.message;
    return `Project not found. Please verify the project ID: ${args.projectId || 'not specified'}.\nError: ${details}`;
  }

  if (combined.includes('invalid') && combined.includes('format')) {
    const details = stderr || stdout || error.message;
    return `Invalid format in request. Please check your parameters.\nError: ${details}`;
  }

  const details = stderr || stdout || error.message;
  return `Failed to create SFTP user: ${details}`;
}

function buildSuccessPayload(
  args: MittwaldSftpUserCreateArgs,
  stdout: string,
  sftpUserId: string | undefined
) {
  return {
    id: sftpUserId,
    description: args.description,
    directories: args.directories,
    accessLevel: args.accessLevel || 'read',
    authenticationMethod: args.publicKey ? 'publicKey' : 'password',
    output: stdout,
    ...(args.expires && { expires: args.expires }),
    ...(args.projectId && { projectId: args.projectId }),
  };
}

export const handleSftpUserCreateCli: MittwaldCliToolHandler<MittwaldSftpUserCreateArgs> = async (args) => {
  try {
    if (!args.description) {
      return formatToolResponse(
        "error",
        "Description is required to create an SFTP user"
      );
    }
    
    if (!args.directories || args.directories.length === 0) {
      return formatToolResponse(
        "error",
        "At least one directory must be specified"
      );
    }
    
    // Validate authentication method - either password or public key, but not both
    if (args.password && args.publicKey) {
      return formatToolResponse(
        "error",
        "Cannot specify both password and public key authentication. Choose one."
      );
    }
    
    if (!args.password && !args.publicKey) {
      return formatToolResponse(
        "error",
        "Either password or public key must be specified for authentication"
      );
    }
    
    const argv = buildCliArgs(args);

    const result = await invokeCliTool({
      toolName: 'mittwald_sftp_user_create',
      argv,
      parser: (stdout) => stdout,
    });

    const commandMeta = {
      command: result.meta.command,
      durationMs: result.meta.durationMs,
    };

    const stdout = result.result ?? '';
    let sftpUserId: string | undefined;

    sftpUserId = extractSftpUserId(stdout);

    const payload = buildSuccessPayload(args, stdout, sftpUserId);

    const message = sftpUserId
      ? `Successfully created SFTP user '${args.description}' with ID ${sftpUserId}`
      : `Successfully created SFTP user '${args.description}'`;

    return formatToolResponse('success', message, payload, commandMeta);
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
