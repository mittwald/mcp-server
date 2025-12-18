import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { parseQuietOutput } from '../../../../utils/cli-output.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';
import { logger } from '../../../../utils/logger.js';
import { revokeOrgMembership, LibraryError } from '@mittwald-mcp/cli-core';
import { validateToolParity } from '../../../../../tests/validation/parallel-validator.js';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';

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

  const effectiveSessionId = context?.sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  logger.warn('[OrgMembershipRevoke] Attempting to revoke membership', {
    membershipId: args.membershipId,
    organizationId: args.organizationId,
    sessionId: context?.sessionId,
    userId: context?.userId,
  });

  const argv = ['org', 'membership', 'revoke', args.membershipId, '--quiet'];

  try {
    // WP05: Parallel validation - run both CLI and library
    const validation = await validateToolParity({
      toolName: 'mittwald_org_membership_revoke',
      cliCommand: 'mw',
      cliArgs: [...argv, '--token', session.mittwaldAccessToken],
      libraryFn: async () => {
        return await revokeOrgMembership({
          membershipId: args.membershipId,
          apiToken: session.mittwaldAccessToken,
        });
      },
      ignoreFields: ['durationMs', 'duration', 'timestamp'],
    });

    // Log validation results
    if (!validation.passed) {
      logger.warn('[WP05 Validation] Output mismatch detected', {
        tool: 'mittwald_org_membership_revoke',
        membershipId: args.membershipId,
        discrepancyCount: validation.discrepancies.length,
        discrepancies: validation.discrepancies,
        cliExitCode: validation.cliOutput.exitCode,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
      });
    } else {
      logger.info('[WP05 Validation] 100% parity achieved', {
        tool: 'mittwald_org_membership_revoke',
        membershipId: args.membershipId,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
        speedup: `${((validation.cliOutput.durationMs / validation.libraryOutput.durationMs) * 100).toFixed(0)}%`,
      });
    }

    const payload: OrgMembershipRevokePayload = {
      membershipId: args.membershipId,
      organizationId: args.organizationId,
      revoked: true,
    };

    return formatToolResponse(
      'success',
      `Membership ${args.membershipId} revoked successfully.`,
      payload,
      {
        durationMs: validation.libraryOutput.durationMs,
        validationPassed: validation.passed,
        discrepancyCount: validation.discrepancies.length,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
      }
    );
  } catch (error) {
    if (error instanceof LibraryError) {
      return formatToolResponse('error', error.message, {
        code: error.code,
        details: error.details,
      });
    }

    if (error instanceof CliToolError) {
      const message = mapCliError(error, args);
      return formatToolResponse('error', message, {
        exitCode: error.exitCode,
        stderr: error.stderr,
        stdout: error.stdout,
        suggestedAction: error.suggestedAction,
      });
    }

    logger.error('[WP05] Unexpected error in org membership revoke handler', { error });
    return formatToolResponse(
      'error',
      `Failed to revoke organization membership: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
