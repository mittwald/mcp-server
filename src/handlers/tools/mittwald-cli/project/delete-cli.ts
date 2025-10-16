import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { logger } from '../../../../utils/logger.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';

interface MittwaldProjectDeleteArgs {
  projectId: string;
  confirm?: boolean;
  force?: boolean;
}

function buildCliArgs(args: MittwaldProjectDeleteArgs): string[] {
  const cliArgs: string[] = ['project', 'delete', args.projectId];

  if (args.force) cliArgs.push('--force');

  return cliArgs;
}

function mapCliError(error: CliToolError, args: MittwaldProjectDeleteArgs): string {
  const combined = `${error.stdout ?? ''}\n${error.stderr ?? ''}`.toLowerCase();
  const errorMessage = error.stderr || error.stdout || error.message;

  if (combined.includes('not found') && combined.includes('project')) {
    return `Project not found. Please verify the project ID: ${args.projectId}.\nError: ${errorMessage}`;
  }

  if (combined.includes('authentication') || combined.includes('unauthorized')) {
    return `Authentication failed. Complete OAuth sign-in and ensure the Mittwald CLI is authenticated.\nError: ${errorMessage}`;
  }

  if (combined.includes('permission') || combined.includes('forbidden')) {
    return `Permission denied. You may not have the required permissions to delete this project.\nError: ${errorMessage}`;
  }

  if (combined.includes('dependencies') || combined.includes('resources')) {
    return `Project deletion failed due to existing dependencies or resources. Please remove all associated resources first.\nError: ${errorMessage}`;
  }

  if (combined.includes('cancelled') || combined.includes('canceled') || combined.includes('aborted')) {
    return `Project deletion was cancelled.\nError: ${errorMessage}`;
  }

  return `Failed to delete project: ${errorMessage}`;
}

export const handleProjectDeleteCli: MittwaldCliToolHandler<MittwaldProjectDeleteArgs> = async (args, sessionId) => {
  const resolvedSessionId = typeof sessionId === 'string' ? sessionId : (sessionId as any)?.sessionId;
  const resolvedUserId = typeof sessionId === 'string' ? undefined : (sessionId as any)?.userId;
  if (!args.projectId) {
    return formatToolResponse('error', 'Project ID is required.');
  }

  if (args.confirm !== true) {
    return formatToolResponse(
      'error',
      'Project deletion requires confirm=true. This operation is destructive and cannot be undone.'
    );
  }

  logger.warn('[ProjectDelete] Destructive operation attempted', {
    projectId: args.projectId,
    force: Boolean(args.force),
    sessionId: resolvedSessionId,
    ...(resolvedUserId ? { userId: resolvedUserId } : {}),
  });

  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_project_delete',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout ?? '';
    const stderr = result.result.stderr ?? '';
    const output = stdout || stderr;

    const message = `Project ${args.projectId} deleted successfully`;

    return formatToolResponse(
      'success',
      message,
      {
        projectId: args.projectId,
        deleted: true,
        output,
        force: Boolean(args.force),
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
