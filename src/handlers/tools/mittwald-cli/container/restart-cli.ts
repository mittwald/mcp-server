import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';

interface MittwaldContainerRestartArgs {
  containerId: string;
  projectId?: string;
  quiet?: boolean;
}

function buildCliArgs(args: MittwaldContainerRestartArgs): string[] {
  const cliArgs: string[] = ['container', 'restart', args.containerId];

  if (args.projectId) cliArgs.push('--project-id', args.projectId);
  if (args.quiet) cliArgs.push('--quiet');

  return cliArgs;
}

function parseQuietOutput(output: string): string | undefined {
  const trimmed = output.trim();
  if (!trimmed) return undefined;
  const lines = trimmed.split(/\r?\n/);
  return lines.at(-1);
}

function mapCliError(error: CliToolError, args: MittwaldContainerRestartArgs): string {
  const combined = `${error.stdout ?? ''}\n${error.stderr ?? ''}`.toLowerCase();

  if (combined.includes('not found') && combined.includes('container')) {
    return `Container not found. Please verify the container ID: ${args.containerId}.\nError: ${error.stderr || error.message}`;
  }

  if (combined.includes('not found') && combined.includes('project')) {
    return `Project not found. Please verify the project ID: ${args.projectId ?? 'not specified'}.\nError: ${error.stderr || error.message}`;
  }

  return error.message;
}

export const handleContainerRestartCli: MittwaldCliToolHandler<MittwaldContainerRestartArgs> = async (args) => {
  if (!args.containerId) {
    return formatToolResponse('error', 'Container ID is required.');
  }

  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_container_restart',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout || '';
    const stderr = result.result.stderr || '';
    const output = stdout || stderr || `Container ${args.containerId} has been restarted successfully`;

    if (args.quiet) {
      const containerId = parseQuietOutput(stdout) ?? args.containerId;
      return formatToolResponse(
        'success',
        `Container ${containerId} has been restarted successfully`,
        {
          containerId,
          action: 'restart',
          projectId: args.projectId,
          output,
        },
        {
          command: result.meta.command,
          durationMs: result.meta.durationMs,
        }
      );
    }

    return formatToolResponse(
      'success',
      `Container ${args.containerId} has been restarted successfully`,
      {
        containerId: args.containerId,
        action: 'restart',
        projectId: args.projectId,
        output,
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

    return formatToolResponse('error', `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`);
  }
};
