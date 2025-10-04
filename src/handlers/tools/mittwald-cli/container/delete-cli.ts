import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { logger } from '../../../../utils/logger.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';

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

function parseQuietOutput(output: string): string | undefined {
  const trimmed = output.trim();
  if (!trimmed) return undefined;
  const lines = trimmed.split(/\r?\n/);
  return lines.at(-1);
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
  const resolvedSessionId = typeof sessionId === 'string' ? sessionId : (sessionId as any)?.sessionId;
  const resolvedUserId = typeof sessionId === 'string' ? undefined : (sessionId as any)?.userId;
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
    sessionId: resolvedSessionId,
    ...(resolvedUserId ? { userId: resolvedUserId } : {}),
  });

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

    if (args.quiet) {
      const containerId = parseQuietOutput(stdout) ?? args.containerId;
      return formatToolResponse(
        'success',
        `Container ${containerId} has been deleted successfully`,
        {
          containerId,
          action: 'delete',
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
