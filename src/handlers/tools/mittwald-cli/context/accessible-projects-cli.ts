import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';
import { parseJsonOutput } from '../../../../utils/cli-wrapper.js';

function buildCliArgs(): string[] {
  return ['user', 'accessible-projects', '--output', 'json'];
}

function mapCliError(error: CliToolError): string {
  const combined = `${error.stderr ?? ''}\n${error.stdout ?? ''}`.toLowerCase();
  const errorText = error.stderr || error.stdout || error.message;

  if (combined.includes('not authenticated') || combined.includes('401')) {
    return `Authentication failed. Complete OAuth sign-in and ensure the Mittwald CLI is authenticated.\nError: ${errorText}`;
  }

  if (combined.includes('forbidden') || combined.includes('403')) {
    return `Access denied. You do not have permission to list accessible projects.\nError: ${errorText}`;
  }

  return `Failed to list accessible projects: ${errorText}`;
}

export const handleUserAccessibleProjectsCli: MittwaldCliToolHandler<Record<string, never>> = async (_args, sessionId) => {
  const argv = buildCliArgs();

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_user_accessible_projects',
      argv,
      sessionId,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout ?? '';

    try {
      const data = parseJsonOutput(stdout);

      if (!Array.isArray(data)) {
        return formatToolResponse(
          'success',
          'Accessible projects retrieved (raw output)',
          {
            rawOutput: stdout,
            parseError: 'Unexpected output format from CLI command',
          },
          {
            command: result.meta.command,
            durationMs: result.meta.durationMs,
          }
        );
      }

      const message = data.length === 0
        ? 'No accessible projects found'
        : `Found ${data.length} accessible project(s)`;

      return formatToolResponse(
        'success',
        message,
        {
          projects: data,
          count: data.length,
        },
        {
          command: result.meta.command,
          durationMs: result.meta.durationMs,
        }
      );
    } catch (parseError) {
      return formatToolResponse(
        'success',
        'Accessible projects retrieved (raw output)',
        {
          rawOutput: stdout,
          parseError: parseError instanceof Error ? parseError.message : String(parseError),
        },
        {
          command: result.meta.command,
          durationMs: result.meta.durationMs,
        }
      );
    }
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
