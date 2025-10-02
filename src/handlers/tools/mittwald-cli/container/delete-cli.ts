import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';

interface MittwaldContainerDeleteArgs {
  containerId: string;
  projectId?: string;
  force?: boolean;
}

function buildCliArgs(args: MittwaldContainerDeleteArgs): string[] {
  const cliArgs: string[] = ['container', 'delete', args.containerId];

  if (args.projectId) cliArgs.push('--project-id', args.projectId);
  if (args.force) cliArgs.push('--force');

  return cliArgs;
}


function mapCliError(error: CliToolError, args: MittwaldContainerDeleteArgs): string {
  const combined = `${error.stdout ?? ''}\n${error.stderr ?? ''}`.toLowerCase();

  if (combined.includes('not found') && combined.includes('container')) {
    return `Container not found. Please verify the container ID: ${args.containerId}.\nError: ${error.stderr || error.message}`;
  }

  if (combined.includes('not found') && combined.includes('project')) {
    return `Project not found. Please verify the project ID: ${args.projectId ?? 'not specified'}.\nError: ${error.stderr || error.message}`;
  }

  if (combined.includes('still running') || combined.includes('must be stopped')) {
    return `Container must be stopped before deletion. Please stop the container first.\nError: ${error.stderr || error.message}`;
  }

  return error.message;
}

export const handleContainerDeleteCli: MittwaldCliToolHandler<MittwaldContainerDeleteArgs> = async (args) => {
  if (!args.containerId) {
    return formatToolResponse('error', 'Container ID is required.');
  }

  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_container_delete',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout || '';
    const stderr = result.result.stderr || '';
    const output = stdout || stderr || `Container ${args.containerId} has been deleted successfully`;

    return formatToolResponse(
      'success',
      `Container ${args.containerId} has been deleted successfully`,
      {
        containerId: args.containerId,
        action: 'delete',
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
