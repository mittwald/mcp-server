import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { logger } from '../../../../utils/logger.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';

interface MittwaldContainerDeleteArgs {
  containerId: string;
  projectId?: string;
  confirm?: boolean;
  force?: boolean;
  quiet?: boolean;
}

function buildCliArgs(args: MittwaldContainerDeleteArgs): string[] {
  const cliArgs: string[] = ['container', 'delete', args.containerId];

  if (args.projectId) cliArgs.push('--project-id', args.projectId);
  if (args.force) cliArgs.push('--force');
  if (args.quiet) cliArgs.push('--quiet');

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

export const handleContainerDeleteCli: MittwaldCliToolHandler<MittwaldContainerDeleteArgs> = async (args, sessionId) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();
  const resolvedUserId = typeof sessionId === 'string' ? undefined : (sessionId as any)?.userId;

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  if (!args.containerId) {
    return formatToolResponse('error', 'Container ID is required.');
  }

  if (args.confirm !== true) {
    return formatToolResponse(
      'error',
      'Container deletion requires confirm=true. This operation is destructive and cannot be undone.'
    );
  }

  logger.warn('[ContainerDelete] Destructive operation attempted', {
    containerId: args.containerId,
    projectId: args.projectId,
    force: Boolean(args.force),
    sessionId: effectiveSessionId,
    ...(resolvedUserId ? { userId: resolvedUserId } : {}),
  });

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_container_delete',
      argv: [...argv, '--token', session.mittwaldAccessToken],
      parser: (stdout, raw) => ({ success: true, stdout, stderr: raw.stderr }),
    });

    return formatToolResponse(
      'success',
      `Container ${args.containerId} has been deleted successfully`,
      {
        containerId: args.containerId,
        action: 'delete',
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

    logger.error('Unexpected error in container delete handler', { error });
    return formatToolResponse('error', `Failed to delete container: ${error instanceof Error ? error.message : String(error)}`);
  }
};
