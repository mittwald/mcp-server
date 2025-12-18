import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { logger } from '../../../../utils/logger.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';
import { revokeOrgInvite, LibraryError } from '@mittwald-mcp/cli-core';
import { validateToolParity } from '../../../../../tests/validation/parallel-validator.js';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';

export interface MittwaldOrgInviteRevokeArgs {
  inviteId: string;
  confirm?: boolean;
  quiet?: boolean;
}

function buildCliArgs(args: MittwaldOrgInviteRevokeArgs): string[] {
  const cliArgs: string[] = ['org', 'invite', 'revoke', args.inviteId];
  if (args.quiet) cliArgs.push('--quiet');
  return cliArgs;
}

function parseQuietOutput(output: string): string | undefined {
  const trimmed = output.trim();
  if (!trimmed) return undefined;
  const lines = trimmed.split(/\r?\n/);
  return lines.at(-1)?.trim();
}

function mapCliError(error: CliToolError, inviteId: string): string {
  const combined = `${error.stdout ?? ''}\n${error.stderr ?? ''}`.toLowerCase();
  const errorMessage = error.stderr || error.stdout || error.message;

  if (combined.includes('not found')) {
    return `Organization invite not found: ${inviteId}.\nError: ${errorMessage}`;
  }

  if (combined.includes('permission denied') || combined.includes('forbidden')) {
    return `Permission denied when revoking organization invite ${inviteId}.\nError: ${errorMessage}`;
  }

  return `Failed to revoke organization invite: ${errorMessage}`;
}

export const handleOrgInviteRevokeCli: MittwaldToolHandler<MittwaldOrgInviteRevokeArgs> = async (args, context) => {
  if (!args.inviteId) {
    return formatToolResponse('error', 'Invite ID is required for revoking an organization invitation.');
  }

  if (args.confirm !== true) {
    return formatToolResponse(
      'error',
      'Organization invite revocation requires confirm=true. This operation is destructive and cannot be undone.'
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

  logger.warn('[OrgInviteRevoke] Destructive operation attempted', {
    inviteId: args.inviteId,
    sessionId: context?.sessionId,
    userId: context?.userId,
  });

  const argv = buildCliArgs(args);

  try {
    // WP05: Parallel validation - run both CLI and library
    const validation = await validateToolParity({
      toolName: 'mittwald_org_invite_revoke',
      cliCommand: 'mw',
      cliArgs: [...argv, '--token', session.mittwaldAccessToken],
      libraryFn: async () => {
        return await revokeOrgInvite({
          inviteId: args.inviteId,
          apiToken: session.mittwaldAccessToken,
        });
      },
      ignoreFields: ['durationMs', 'duration', 'timestamp'],
    });

    // Log validation results
    if (!validation.passed) {
      logger.warn('[WP05 Validation] Output mismatch detected', {
        tool: 'mittwald_org_invite_revoke',
        inviteId: args.inviteId,
        discrepancyCount: validation.discrepancies.length,
        discrepancies: validation.discrepancies,
        cliExitCode: validation.cliOutput.exitCode,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
      });
    } else {
      logger.info('[WP05 Validation] 100% parity achieved', {
        tool: 'mittwald_org_invite_revoke',
        inviteId: args.inviteId,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
        speedup: `${((validation.cliOutput.durationMs / validation.libraryOutput.durationMs) * 100).toFixed(0)}%`,
      });
    }

    return formatToolResponse(
      'success',
      `Organization invite ${args.inviteId} revoked successfully`,
      {
        inviteId: args.inviteId,
        revoked: true,
      },
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
      const message = mapCliError(error, args.inviteId);
      return formatToolResponse('error', message, {
        exitCode: error.exitCode,
        stderr: error.stderr,
        stdout: error.stdout,
        suggestedAction: error.suggestedAction,
      });
    }

    logger.error('[WP05] Unexpected error in org invite revoke handler', { error });
    return formatToolResponse('error', `Failed to revoke organization invite: ${error instanceof Error ? error.message : String(error)}`);
  }
};
