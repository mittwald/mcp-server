import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';
import { buildSecureToolResponse } from '../../../../utils/credential-response.js';

interface MittwaldSshUserCreateArgs {
  projectId?: string;
  description: string;
  quiet?: boolean;
  expires?: string;
  publicKey?: string;
  password?: string;
}

function buildCliArgs(args: MittwaldSshUserCreateArgs): string[] {
  const cliArgs: string[] = ['ssh-user', 'create', '--description', args.description];

  if (args.projectId) cliArgs.push('--project-id', args.projectId);
  if (args.quiet ?? true) cliArgs.push('--quiet');
  if (args.expires) cliArgs.push('--expires', args.expires);
  if (args.publicKey) cliArgs.push('--public-key', args.publicKey);
  if (args.password) cliArgs.push('--password', args.password);

  return cliArgs;
}

function parseQuietOutput(output: string): string | undefined {
  const trimmed = output.trim();
  if (!trimmed) return undefined;
  const lines = trimmed.split(/\r?\n/);
  return lines.at(-1)?.trim();
}

function extractSshUserId(output: string): string | undefined {
  const match = output.match(/ID\s+([a-f0-9-]+)/i);
  return match ? match[1] : undefined;
}

function mapCliError(error: CliToolError, args: MittwaldSshUserCreateArgs): string {
  const stderr = error.stderr ?? '';
  const stdout = error.stdout ?? '';
  const combined = `${stderr}\n${stdout}\n${error.message}`.toLowerCase();

  if (combined.includes('403') || combined.includes('forbidden') || combined.includes('permission denied')) {
    return `Permission denied when creating SSH user. Complete OAuth sign-in and ensure the Mittwald CLI is authenticated.\nError: ${stderr || stdout || error.message}`;
  }

  if (combined.includes('not found') && combined.includes('project')) {
    return `Project not found. Please verify the project ID: ${args.projectId || 'not specified'}.\nError: ${stderr || stdout || error.message}`;
  }

  if (combined.includes('invalid') && combined.includes('format')) {
    return `Invalid format in request. Please check your parameters.\nError: ${stderr || stdout || error.message}`;
  }

  return `Failed to create SSH user: ${stderr || stdout || error.message}`;
}

export const handleSshUserCreateCli: MittwaldCliToolHandler<MittwaldSshUserCreateArgs> = async (
  args,
  sessionId,
) => {
  if (!args.description) {
    return buildSecureToolResponse('error', 'Description is required to create an SSH user');
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
      toolName: 'mittwald_ssh_user_create',
      argv,
      sessionId,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout ?? '';
    const sshUserId = parseQuietOutput(stdout) ?? extractSshUserId(stdout);

    const authentication = {
      method: args.publicKey ? 'publicKey' : 'password',
      passwordProvided: Boolean(args.password),
      publicKeyProvided: Boolean(args.publicKey),
    };

    const responseData = {
      id: sshUserId,
      description: args.description,
      authentication,
      projectId: args.projectId,
      expires: args.expires,
    };

    const message = sshUserId
      ? `Successfully created SSH user '${args.description}' with ID ${sshUserId}`
      : `Successfully created SSH user '${args.description}'`;

    return buildSecureToolResponse(
      'success',
      args.quiet ? sshUserId ?? message : message,
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
