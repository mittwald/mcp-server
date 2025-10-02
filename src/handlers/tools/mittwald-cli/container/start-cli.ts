import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';

interface MittwaldContainerStartArgs {
  containerId: string;
  projectId?: string;
}

function buildCliArgs(args: MittwaldContainerStartArgs): string[] {
  const cliArgs: string[] = ['container', 'start', args.containerId];

  if (args.projectId) cliArgs.push('--project-id', args.projectId);

  return cliArgs;
}


function mapCliError(error: CliToolError, args: MittwaldContainerStartArgs): string {
  const combined = `${error.stdout ?? ''}\n${error.stderr ?? ''}`.toLowerCase();

  if (combined.includes('not found') && combined.includes('container')) {
    return `Container not found. Please verify the container ID: ${args.containerId}.\nError: ${error.stderr || error.message}`;
  }

  if (combined.includes('not found') && combined.includes('project')) {
    return `Project not found. Please verify the project ID: ${args.projectId ?? 'not specified'}.\nError: ${error.stderr || error.message}`;
  }

  if (combined.includes('already running') || combined.includes('already started')) {
    return `Container ${args.containerId} is already running.\nError: ${error.stderr || error.message}`;
  }

  return error.message;
}

export const handleContainerStartCli: MittwaldCliToolHandler<MittwaldContainerStartArgs> = async (args) => {
  if (!args.containerId) {
    return formatToolResponse('error', 'Container ID is required.');
  }

  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_container_start',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout || '';
    const stderr = result.result.stderr || '';
    const output = stdout || stderr || `Container ${args.containerId} has been started successfully`;

    return formatToolResponse(
      'success',
      `Container ${args.containerId} has been started successfully`,
      {
        containerId: args.containerId,
        action: 'start',
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
