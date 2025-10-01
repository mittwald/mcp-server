import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';

interface MittwaldLoginResetArgs {
  // No specific parameters needed for reset
}

function mapCliError(error: CliToolError): string {
  const combined = `${error.stderr ?? ''} ${error.stdout ?? ''}`.toLowerCase();

  if (combined.includes('not logged in') || combined.includes('no active session')) {
    return 'No active login session to reset';
  }

  return `Failed to reset login: ${error.stderr || error.stdout || error.message}`;
}

export const handleLoginResetCli: MittwaldCliToolHandler<MittwaldLoginResetArgs> = async () => {
  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_login_reset',
      argv: ['login', 'reset'],
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const output = result.result.stdout?.trim() ?? '';

    return formatToolResponse(
      'success',
      'Login session reset successfully',
      {
        message: 'Login session reset successfully',
        output: output || null,
        timestamp: new Date().toISOString(),
      },
      {
        command: result.meta.command,
        durationMs: result.meta.durationMs,
      }
    );
  } catch (error) {
    if (error instanceof CliToolError) {
      const message = mapCliError(error);

      if (message === 'No active login session to reset') {
        return formatToolResponse(
          'success',
          message,
          {
            message,
            output: error.stderr || error.stdout || null,
            timestamp: new Date().toISOString(),
          }
        );
      }

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
