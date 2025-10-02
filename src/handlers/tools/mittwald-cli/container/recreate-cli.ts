import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';

interface MittwaldContainerRecreateArgs {
  containerId: string;
  projectId?: string;
  pull?: boolean;
  force?: boolean;
}

function buildCliArgs(args: MittwaldContainerRecreateArgs): string[] {
  const cliArgs: string[] = ['container', 'recreate', args.containerId];

  if (args.projectId) cliArgs.push('--project-id', args.projectId);
  if (args.pull) cliArgs.push('--pull');
  if (args.force) cliArgs.push('--force');

  return cliArgs;
}


function mapCliError(error: CliToolError, args: MittwaldContainerRecreateArgs): string {
  const combined = `${error.stdout ?? ''}\n${error.stderr ?? ''}`.toLowerCase();

  if (combined.includes('not found') && combined.includes('container')) {
    return `Container not found. Please verify the container ID: ${args.containerId}.\nError: ${error.stderr || error.message}`;
  }

  if (combined.includes('not found') && combined.includes('project')) {
    return `Project not found. Please verify the project ID: ${args.projectId ?? 'not specified'}.\nError: ${error.stderr || error.message}`;
  }

  if (combined.includes('up to date') && !args.force) {
    return `Container is already up to date. Use --force to recreate anyway.\nError: ${error.stderr || error.message}`;
  }

  return error.message;
}

export const handleContainerRecreateCli: MittwaldCliToolHandler<MittwaldContainerRecreateArgs> = async (args) => {
  if (!args.containerId) {
    return formatToolResponse('error', 'Container ID is required.');
  }

  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_container_recreate',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout || '';
    const stderr = result.result.stderr || '';
    const output = stdout || stderr || `Container ${args.containerId} has been recreated successfully`;

    return formatToolResponse(
      'success',
      `Container ${args.containerId} has been recreated successfully`,
      {
        containerId: args.containerId,
        action: 'recreate',
        projectId: args.projectId,
        pull: args.pull,
        force: args.force,
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
