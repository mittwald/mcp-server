import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';

interface MittwaldLoginTokenArgs {
  token: string;
}

function buildCliArgs(args: MittwaldLoginTokenArgs): string[] {
  return ['login', 'token', args.token];
}

function mapCliError(error: CliToolError): string {
  const combined = `${error.stdout ?? ''}\n${error.stderr ?? ''}`.toLowerCase();

  if (combined.includes('invalid token') || combined.includes('authentication failed')) {
    return `Invalid API token: ${error.stderr || error.message}`;
  }

  if (combined.includes('network error') || combined.includes('connection failed')) {
    return `Network error during login: ${error.stderr || error.message}`;
  }

  return error.message;
}

export const handleLoginTokenCli: MittwaldCliToolHandler<MittwaldLoginTokenArgs> = async (args) => {
  if (!args.token) {
    return formatToolResponse('error', 'API token is required');
  }

  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_login_token',
      argv,
      parser: (stdout, raw) => ({ stdout: stdout.trim(), stderr: raw.stderr }),
    });

    const stdout = result.result.stdout || '';
    const stderr = result.result.stderr || '';
    const output = stdout || stderr;

    const responseData = {
      message: 'Login successful with API token',
      output: output || null,
      timestamp: new Date().toISOString(),
    };

    return formatToolResponse(
      'success',
      'Login successful with API token',
      responseData,
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

    return formatToolResponse('error', `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`);
  }
};
