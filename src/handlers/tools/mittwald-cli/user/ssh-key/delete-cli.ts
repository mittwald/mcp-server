import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../../tools/index.js';

interface MittwaldUserSshKeyDeleteArgs {
  keyId: string;
  force?: boolean;
}

function buildCliArgs(args: MittwaldUserSshKeyDeleteArgs): string[] {
  const argv = ['user', 'ssh-key', 'delete', args.keyId];
  if (args.force) argv.push('--force');
  return argv;
}


function mapCliError(error: CliToolError, args: MittwaldUserSshKeyDeleteArgs): string {
  const stdout = error.stdout ?? '';
  const stderr = error.stderr ?? '';
  const combined = `${stdout}\n${stderr}`.toLowerCase();

  if (combined.includes('not found') || combined.includes('no ssh key found')) {
    return `SSH key not found: ${args.keyId}.\nError: ${stderr || error.message}`;
  }

  const rawMessage = stderr || stdout || error.message;
  return `Failed to delete SSH key: ${rawMessage}`;
}

export const handleUserSshKeyDeleteCli: MittwaldCliToolHandler<MittwaldUserSshKeyDeleteArgs> = async (args) => {
  if (!args.keyId || !args.keyId.trim()) {
    return formatToolResponse('error', 'SSH key ID is required.');
  }

  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_user_ssh_key_delete',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout ?? '';
    const stderr = result.result.stderr ?? '';
    const output = stdout.trim() || stderr.trim();

    const message = output || `SSH key ${args.keyId} deleted successfully`;
    return formatToolResponse(
      'success',
      message,
      {
        keyId: args.keyId,
        deleted: true,
        rawOutput: output,
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
