import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';

interface MittwaldContextResetArgs {
  // No specific parameters needed for reset
}

function buildCliArgs(): string[] {
  return ['context', 'reset'];
}

function mapCliError(error: CliToolError): string {
  const combined = `${error.stdout ?? ''}\n${error.stderr ?? ''}`.toLowerCase();
  if (combined.includes('no context to reset')) {
    return 'No context parameters were set to reset';
  }
  return error.message;
}

export const handleContextResetCli: MittwaldCliToolHandler<MittwaldContextResetArgs> = async () => {
  const argv = buildCliArgs();

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_context_reset',
      argv,
      parser: (stdout) => stdout.trim(),
    });

    const output = result.result;
    const responseData = {
      message: 'Context parameters reset successfully',
      output: output || null,
      timestamp: new Date().toISOString(),
    };

    return formatToolResponse(
      'success',
      'Context parameters reset successfully',
      responseData,
      {
        command: result.meta.command,
        durationMs: result.meta.durationMs,
      }
    );
  } catch (error) {
    if (error instanceof CliToolError) {
      const combined = `${error.stdout ?? ''}\n${error.stderr ?? ''}`;
      if (combined.toLowerCase().includes('no context to reset')) {
        return formatToolResponse(
          'success',
          'No context parameters were set to reset',
          {
            message: 'No context parameters were set to reset',
            output: combined.trim() || null,
            timestamp: new Date().toISOString(),
          },
          error.command
            ? {
                command: error.command,
              }
            : undefined
        );
      }

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
