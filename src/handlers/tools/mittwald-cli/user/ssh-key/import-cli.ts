import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../../tools/index.js';

interface MittwaldUserSshKeyImportArgs {
  expires?: string;
  input?: string;
}

function buildCliArgs(args: MittwaldUserSshKeyImportArgs): string[] {
  const argv = ['user', 'ssh-key', 'import'];
  if (args.expires) argv.push('--expires', args.expires);
  if (args.input) argv.push('--input', args.input);
  return argv;
}


function mapCliError(error: CliToolError): string {
  const stdout = error.stdout ?? '';
  const stderr = error.stderr ?? '';
  const rawMessage = stderr || stdout || error.message;
  return `Failed to import SSH key: ${rawMessage}`;
}

export const handleUserSshKeyImportCli: MittwaldCliToolHandler<MittwaldUserSshKeyImportArgs> = async (args) => {
  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_user_ssh_key_import',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout ?? '';
    const stderr = result.result.stderr ?? '';
    const output = stdout.trim() || stderr.trim();

    const message = output || 'SSH key imported successfully';
    return formatToolResponse(
      'success',
      message,
      {
        expires: args.expires,
        input: args.input,
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
