import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { parseQuietOutput } from '../../../../utils/cli-wrapper.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';
import { logger } from '../../../../utils/logger.js';

interface OrgDeleteArgs {
  organizationId: string;
  confirm: boolean;
}

interface OrgDeletePayload {
  organizationId: string;
  deleted: boolean;
  result?: string;
}

/**
 * Maps CLI errors to descriptive messages for organization deletion.
 *
 * @param error - CLI adapter error.
 * @param organizationId - Organization slated for deletion.
 * @returns Human-readable error string.
 */
function mapCliError(error: CliToolError, organizationId: string): string {
  const stderr = error.stderr ?? '';
  const stdout = error.stdout ?? '';
  const combined = `${stderr}\n${stdout}`.toLowerCase();

  if (combined.includes('not found')) {
    const details = stderr || stdout || error.message;
    return `Organization not found: ${organizationId}.\nError: ${details}`;
  }

  if (error.kind === 'AUTHENTICATION' || combined.includes('unauthorized') || combined.includes('not authenticated')) {
    const details = stderr || stdout || error.message;
    return `Authentication failed when deleting organization ${organizationId}.\nError: ${details}`;
  }

  if (combined.includes('forbidden') || combined.includes('permission denied')) {
    const details = stderr || stdout || error.message;
    return `Permission denied while deleting organization ${organizationId}.\nError: ${details}`;
  }

  const details = stderr || stdout || error.message;
  return `Failed to delete organization ${organizationId}: ${details}`;
}

/**
 * Handler for the `mittwald_org_delete` tool.
 */
export const handleOrgDeleteCli: MittwaldToolHandler<OrgDeleteArgs> = async (args, context) => {
  if (!args.organizationId) {
    return formatToolResponse('error', 'Parameter "organizationId" is required.');
  }

  if (args.confirm !== true) {
    return formatToolResponse(
      'error',
      'Organization deletion requires confirm=true. This operation is destructive and cannot be undone.'
    );
  }

  logger.warn('[OrgDelete] Attempting to delete organization', {
    organizationId: args.organizationId,
    sessionId: context?.sessionId,
    userId: context?.userId,
  });

  const argv = ['org', 'delete', args.organizationId, '--force', '--quiet'];

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_org_delete',
      argv,
    });

    const { command, durationMs } = result.meta;
    const rawOutput = result.result ?? '';
    const quietResult = parseQuietOutput(rawOutput) ?? undefined;

    const payload: OrgDeletePayload = {
      organizationId: args.organizationId,
      deleted: true,
      result: quietResult ?? (rawOutput || undefined),
    };

    return formatToolResponse(
      'success',
      `Organization ${args.organizationId} deleted successfully.`,
      payload,
      {
        command,
        durationMs,
      }
    );
  } catch (error) {
    if (error instanceof CliToolError) {
      const message = mapCliError(error, args.organizationId);
      return formatToolResponse('error', message, {
        exitCode: error.exitCode,
        stderr: error.stderr,
        stdout: error.stdout,
        suggestedAction: error.suggestedAction,
      });
    }

    return formatToolResponse(
      'error',
      `Failed to execute organization delete command: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
