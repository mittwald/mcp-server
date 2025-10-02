import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../../tools/index.js';

interface MittwaldUserSshKeyCreateArgs {
  expires?: string;
  output?: string;
  noPassphrase?: boolean;
  comment?: string;
}

function buildCliArgs(args: MittwaldUserSshKeyCreateArgs): string[] {
  const argv = ['user', 'ssh-key', 'create'];

  if (args.expires) argv.push('--expires', args.expires);
  if (args.output) argv.push('--output', args.output);
  if (args.noPassphrase) argv.push('--no-passphrase');
  if (args.comment) argv.push('--comment', args.comment);

  return argv;
}


function mapCliError(error: CliToolError): string {
  const stdout = error.stdout ?? '';
  const stderr = error.stderr ?? '';
  const rawMessage = stderr || stdout || error.message;
  return `Failed to create SSH key: ${rawMessage}`;
}

export const handleUserSshKeyCreateCli: MittwaldCliToolHandler<MittwaldUserSshKeyCreateArgs> = async (args) => {
  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_user_ssh_key_create',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout ?? '';
    const stderr = result.result.stderr ?? '';
    const output = stdout.trim() || stderr.trim();

    const message = output || 'SSH key created successfully';

    return formatToolResponse(
      'success',
      message,
      {
        expires: args.expires,
        output: args.output,
        comment: args.comment,
        rawOutput: output,
      },
      {
        command: result.meta.command,
        durationMs: result.meta.durationMs,
      }
    );
  } catch (error) {
    if (error instanceof CliToolError) {
      const message = mapCliError(error);
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
