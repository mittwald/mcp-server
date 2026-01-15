import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';
import { logger } from '../../../../utils/logger.js';

interface MittwaldContainerStopArgs {
  containerId: string;
  projectId?: string;
  quiet?: boolean;
}

function buildCliArgs(args: MittwaldContainerStopArgs): string[] {
  const cliArgs: string[] = ['container', 'stop', args.containerId];

  if (args.projectId) cliArgs.push('--project-id', args.projectId);
  if (args.quiet) cliArgs.push('--quiet');

  return cliArgs;
}

function mapCliError(error: CliToolError, args: MittwaldContainerStopArgs): string {
  const combined = `${error.stdout ?? ''}\n${error.stderr ?? ''}`.toLowerCase();

  if (combined.includes('not found') && combined.includes('container')) {
    return `Container not found. Please verify the container ID: ${args.containerId}.\nError: ${error.stderr || error.message}`;
  }

  if (combined.includes('not found') && combined.includes('project')) {
    return `Project not found. Please verify the project ID: ${args.projectId ?? 'not specified'}.\nError: ${error.stderr || error.message}`;
  }

  if (combined.includes('already stopped') || combined.includes('not running')) {
    return `Container ${args.containerId} is already stopped.\nError: ${error.stderr || error.message}`;
  }

  return error.message;
}

export const handleContainerStopCli: MittwaldCliToolHandler<MittwaldContainerStopArgs> = async (args, sessionId) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  if (!args.containerId) {
    return formatToolResponse('error', 'Container ID is required.');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_container_stop',
      argv: [...argv, '--token', session.mittwaldAccessToken],
      parser: (stdout, raw) => ({ success: true, stdout, stderr: raw.stderr }),
    });

    return formatToolResponse(
      'success',
      `Container ${args.containerId} has been stopped successfully`,
      {
        containerId: args.containerId,
        action: 'stop',
        projectId: args.projectId,
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

    logger.error('Unexpected error in container stop handler', { error });
    return formatToolResponse('error', `Failed to stop container: ${error instanceof Error ? error.message : String(error)}`);
  }
};
