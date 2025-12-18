import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { parseJsonOutput } from '../../../../utils/cli-output.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';
import { getProjectInvite, LibraryError } from '@mittwald-mcp/cli-core';
import { validateToolParity } from '../../../../../tests/validation/parallel-validator.js';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';
import { logger } from '../../../../utils/logger.js';

export interface MittwaldProjectInviteGetArgs {
  inviteId: string;
  output?: 'json' | 'table' | 'yaml';
}

function buildCliArgs(args: MittwaldProjectInviteGetArgs): string[] {
  return ['project', 'invite', 'get', args.inviteId, '--output', 'json'];
}

function mapCliError(error: CliToolError, args: MittwaldProjectInviteGetArgs): string {
  const combined = `${error.stderr ?? ''}\n${error.stdout ?? ''}`.toLowerCase();
  const errorText = error.stderr || error.stdout || error.message;

  if (combined.includes('not found') || combined.includes('404')) {
    return `Project invite not found. Please verify the invite ID: ${args.inviteId}.\nError: ${errorText}`;
  }

  if (combined.includes('not authenticated') || combined.includes('401')) {
    return `Authentication failed. Complete OAuth sign-in and ensure the Mittwald CLI is authenticated.\nError: ${errorText}`;
  }

  if (combined.includes('forbidden') || combined.includes('403')) {
    return `Access denied. You don't have permission to view this project invite.\nError: ${errorText}`;
  }

  return `Failed to get project invite: ${errorText}`;
}

export const handleProjectInviteGetCli: MittwaldCliToolHandler<MittwaldProjectInviteGetArgs> = async (args, sessionId) => {
  if (!args.inviteId) {
    return formatToolResponse('error', 'Invite ID is required.');
  }

  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  const argv = buildCliArgs(args);

  try {
    // WP04: Parallel validation - run both CLI and library
    const validation = await validateToolParity({
      toolName: 'mittwald_project_invite_get',
      cliCommand: 'mw',
      cliArgs: [...argv, '--token', session.mittwaldAccessToken],
      libraryFn: async () => {
        return await getProjectInvite({
          inviteId: args.inviteId,
          apiToken: session.mittwaldAccessToken,
        });
      },
      ignoreFields: ['durationMs', 'duration', 'timestamp'],
    });

    // Log validation results
    if (!validation.passed) {
      logger.warn('[WP04 Validation] Output mismatch detected', {
        tool: 'mittwald_project_invite_get',
        inviteId: args.inviteId,
        discrepancyCount: validation.discrepancies.length,
        discrepancies: validation.discrepancies,
        cliExitCode: validation.cliOutput.exitCode,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
      });
    } else {
      logger.info('[WP04 Validation] 100% parity achieved', {
        tool: 'mittwald_project_invite_get',
        inviteId: args.inviteId,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
        speedup: `${((validation.cliOutput.durationMs / validation.libraryOutput.durationMs) * 100).toFixed(0)}%`,
      });
    }

    // Use library result (it's validated) - data is object
    const data = validation.libraryOutput.data as any;

    const formattedData = {
      id: data.id,
      email: data.mailAddress || data.email,
      role: data.projectRole || data.role,
      status: data.expired ? 'expired' : 'active',
      createdAt: data.createdAt,
      expiresAt: data.membershipExpiresAt || data.expiresAt || 'Never',
      projectId: data.projectId,
      userId: data.userId,
      invitedBy: data.invitedBy || data.inviter,
      message: data.message,
    };

    return formatToolResponse(
      'success',
      'Project invite retrieved successfully',
      formattedData,
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

    logger.error('[WP04] Unexpected error in project invite get handler', { error });
    return formatToolResponse('error', `Failed to get project invite: ${error instanceof Error ? error.message : String(error)}`);
  }
};
