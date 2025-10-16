import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { parseQuietOutput } from '../../../../utils/cli-output.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';
import { logger } from '../../../../utils/logger.js';

interface OrgMembershipRevokeArgs {
  membershipId: string;
  organizationId?: string;
  confirm?: boolean;
}

interface OrgMembershipRevokePayload {
  membershipId: string;
  organizationId?: string;
  revoked: boolean;
  result?: string;
}

/**
 * Maps CLI errors to descriptive revoke messages.
 *
 * @param error - CLI adapter error.
 * @param args - Tool arguments used for the revocation.
 * @returns Human-readable error message.
 */
function mapCliError(error: CliToolError, args: OrgMembershipRevokeArgs): string {
  const stderr = error.stderr ?? '';
  const stdout = error.stdout ?? '';
  const combined = `${stderr}\n${stdout}`.toLowerCase();

  if (combined.includes('not found')) {
    const details = stderr || stdout || error.message;
    return `Membership not found: ${args.membershipId}.\nError: ${details}`;
  }

  if (error.kind === 'AUTHENTICATION' || combined.includes('unauthorized') || combined.includes('not authenticated')) {
    const details = stderr || stdout || error.message;
    return `Authentication failed when revoking membership ${args.membershipId}.\nError: ${details}`;
  }

  if (combined.includes('permission denied') || combined.includes('forbidden')) {
    const details = stderr || stdout || error.message;
    return `Permission denied while revoking membership ${args.membershipId}.\nError: ${details}`;
  }

  const details = stderr || stdout || error.message;
  return `Failed to revoke organization membership: ${details}`;
}

/**
 * Handler for the `mittwald_org_membership_revoke` tool.
 */
export const handleOrgMembershipRevokeCli: MittwaldToolHandler<OrgMembershipRevokeArgs> = async (args, context) => {
  if (!args.membershipId) {
    return formatToolResponse('error', 'Parameter "membershipId" is required.');
  }

  if (args.confirm !== true) {
    return formatToolResponse(
      'error',
      'Membership revocation requires confirm=true. This operation is destructive and cannot be undone.'
    );
  }

  logger.warn('[OrgMembershipRevoke] Attempting to revoke membership', {
    membershipId: args.membershipId,
    organizationId: args.organizationId,
    sessionId: context?.sessionId,
    userId: context?.userId,
  });

  const argv = ['org', 'membership', 'revoke', args.membershipId, '--quiet'];

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_org_membership_revoke',
      argv,
    });

    const { command, durationMs } = result.meta;
    const rawOutput = result.result ?? '';
    const quietResult = parseQuietOutput(rawOutput) ?? undefined;

    const payload: OrgMembershipRevokePayload = {
      membershipId: args.membershipId,
      organizationId: args.organizationId,
      revoked: true,
      result: quietResult ?? (rawOutput || undefined),
    };

    return formatToolResponse(
      'success',
      `Membership ${args.membershipId} revoked successfully.`,
      payload,
      {
        command,
        durationMs,
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

    return formatToolResponse(
      'error',
      `Failed to execute organization membership revoke command: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
