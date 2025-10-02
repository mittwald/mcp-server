import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';

interface MittwaldLoginResetArgs {}

function buildSuccessPayload(message: string, output: string) {
  return {
    message,
    output,
    timestamp: new Date().toISOString(),
  };
}

export const handleLoginResetCli: MittwaldCliToolHandler<MittwaldLoginResetArgs> = async () => {
  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_login_reset',
      argv: ['login', 'reset'],
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout?.trim() ?? '';
    const stderr = result.result.stderr?.trim() ?? '';
    const output = stdout || stderr || 'Authentication state successfully reset.';

    return formatToolResponse(
      'success',
      'Login session reset successfully',
      buildSuccessPayload('Login session reset successfully', output),
      {
        command: result.meta.command,
        durationMs: result.meta.durationMs,
      }
    );
  } catch (error) {
    if (error instanceof CliToolError) {
      const combined = `${error.stdout ?? ''}\n${error.stderr ?? ''}`.toLowerCase();
      const detail = error.stderr || error.stdout || error.message;

      if (combined.includes('not logged in') || combined.includes('no active session')) {
        return formatToolResponse(
          'success',
          'No active login session to reset',
          buildSuccessPayload('No active login session to reset', detail),
          error.command
            ? {
                command: error.command,
                exitCode: error.exitCode,
              }
            : undefined
        );
      }

      const friendly = combined.includes('permission')
        ? `Permission denied while resetting login. Please authenticate again.\nError: ${detail}`
        : `Failed to reset login: ${detail}`;

      return formatToolResponse('error', friendly, {
        exitCode: error.exitCode,
        stderr: error.stderr,
        stdout: error.stdout,
        suggestedAction: error.suggestedAction,
      });
    }

    return formatToolResponse('error', `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`);
  }
};
