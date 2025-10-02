import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';

interface MittwaldSshUserCreateArgs {
  projectId?: string;
  description: string;
  expires?: string;
  publicKey?: string;
  password?: string;
}

function buildCliArgs(args: MittwaldSshUserCreateArgs): string[] {
  const cliArgs: string[] = ['ssh-user', 'create', '--description', args.description];

  if (args.projectId) cliArgs.push('--project-id', args.projectId);
  if (args.expires) cliArgs.push('--expires', args.expires);
  if (args.publicKey) cliArgs.push('--public-key', args.publicKey);
  if (args.password) cliArgs.push('--password', args.password);

  return cliArgs;
}


function extractSshUserId(output: string): string | undefined {
  const match = output.match(/ID\s+([a-f0-9-]+)/i);
  if (match) return match[1];
  return undefined;
}

function mapCliError(error: CliToolError, args: MittwaldSshUserCreateArgs): string {
  const stderr = error.stderr ?? '';
  const stdout = error.stdout ?? '';
  const combined = `${stderr}\n${stdout}\n${error.message}`.toLowerCase();

  if (combined.includes('403') || combined.includes('forbidden') || combined.includes('permission denied')) {
    const details = stderr || stdout || error.message;
    return `Permission denied when creating SSH user. Complete OAuth sign-in and ensure the Mittwald CLI is authenticated.\nError: ${details}`;
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
  return `Failed to create SSH user: ${details}`;
}

function buildSuccessPayload(
  args: MittwaldSshUserCreateArgs,
  stdout: string,
  sshUserId: string | undefined
) {
  return {
    id: sshUserId,
    description: args.description,
    authenticationMethod: args.publicKey ? 'publicKey' : 'password',
    output: stdout,
    ...(args.expires && { expires: args.expires }),
    ...(args.projectId && { projectId: args.projectId }),
  };
}

export const handleSshUserCreateCli: MittwaldCliToolHandler<MittwaldSshUserCreateArgs> = async (args) => {
  if (!args.description) {
    return formatToolResponse('error', 'Description is required to create an SSH user');
  }

  if (args.password && args.publicKey) {
    return formatToolResponse('error', 'Cannot specify both password and public key authentication. Choose one.');
  }

  if (!args.password && !args.publicKey) {
    return formatToolResponse('error', 'Either password or public key must be specified for authentication');
  }

  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_ssh_user_create',
      argv,
      parser: (stdout) => stdout,
    });

    const meta = {
      command: result.meta.command,
      durationMs: result.meta.durationMs,
    };

    const stdout = result.result ?? '';

    const sshUserId = extractSshUserId(stdout);
    const payload = buildSuccessPayload(args, stdout, sshUserId);

    const message = sshUserId
      ? `Successfully created SSH user '${args.description}' with ID ${sshUserId}`
      : `Successfully created SSH user '${args.description}'`;

    return formatToolResponse('success', message, payload, meta);
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
