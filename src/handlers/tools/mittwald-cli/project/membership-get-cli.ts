import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';
import { getProjectMembership, LibraryError } from '@mittwald-mcp/cli-core';
import { validateToolParity } from '../../../../../tests/validation/parallel-validator.js';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';
import { logger } from '../../../../utils/logger.js';

export interface MittwaldProjectMembershipGetArgs {
  membershipId: string;
  output?: 'txt' | 'json' | 'yaml';
}

function buildCliArgs(args: MittwaldProjectMembershipGetArgs): string[] {
  return ['project', 'membership', 'get', args.membershipId, '--output', 'json'];
}

function mapCliError(error: CliToolError, args: MittwaldProjectMembershipGetArgs): string {
  const stderr = error.stderr ?? '';
  const stdout = error.stdout ?? '';
  const combined = `${stderr}\n${stdout}\n${error.message}`.toLowerCase();

  if (combined.includes('not found') || combined.includes('404')) {
    const details = stderr || stdout || error.message;
    return `Project membership not found. Please verify the membership ID: ${args.membershipId}.\nError: ${details}`;
  }

  if (error.kind === 'AUTHENTICATION' || combined.includes('not authenticated') || combined.includes('401')) {
    const details = stderr || stdout || error.message;
    return `Authentication failed. Complete OAuth sign-in and ensure the Mittwald CLI is authenticated.\nError: ${details}`;
  }

  if (combined.includes('forbidden') || combined.includes('403')) {
    const details = stderr || stdout || error.message;
    return `Access denied. You don't have permission to view this project membership.\nError: ${details}`;
  }

  const details = stderr || stdout || error.message;
  return `Failed to get project membership: ${details}`;
}

function formatMembership(record: Record<string, unknown>) {
  const user = (record.user ?? {}) as Record<string, unknown>;
  const person = (user.person ?? {}) as Record<string, unknown>;
  return {
    id: record.id,
    userId: record.userId,
    email: record.email ?? user.email,
    name: record.name ?? user.name ?? person.name,
    role: record.role ?? record.projectRole,
    status: record.status ?? 'active',
    createdAt: record.createdAt,
    expiresAt: record.expiresAt ?? record.membershipExpiresAt ?? 'Never',
    projectId: record.projectId,
    permissions: record.permissions ?? record.projectPermissions,
  };
}

export const handleProjectMembershipGetCli: MittwaldCliToolHandler<MittwaldProjectMembershipGetArgs> = async (args, sessionId) => {
  if (!args.membershipId) {
    return formatToolResponse('error', 'Project membership ID is required.');
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
      toolName: 'mittwald_project_membership_get',
      cliCommand: 'mw',
      cliArgs: [...argv, '--token', session.mittwaldAccessToken],
      libraryFn: async () => {
        return await getProjectMembership({
          membershipId: args.membershipId,
          apiToken: session.mittwaldAccessToken,
        });
      },
      ignoreFields: ['durationMs', 'duration', 'timestamp'],
    });

    // Log validation results
    if (!validation.passed) {
      logger.warn('[WP04 Validation] Output mismatch detected', {
        tool: 'mittwald_project_membership_get',
        membershipId: args.membershipId,
        discrepancyCount: validation.discrepancies.length,
        discrepancies: validation.discrepancies,
        cliExitCode: validation.cliOutput.exitCode,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
      });
    } else {
      logger.info('[WP04 Validation] 100% parity achieved', {
        tool: 'mittwald_project_membership_get',
        membershipId: args.membershipId,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
        speedup: `${((validation.cliOutput.durationMs / validation.libraryOutput.durationMs) * 100).toFixed(0)}%`,
      });
    }

    // Use library result (it's validated) - data is object
    const membership = validation.libraryOutput.data as Record<string, unknown>;
    const formatted = formatMembership(membership);

    return formatToolResponse(
      'success',
      'Project membership retrieved successfully',
      formatted,
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

    logger.error('[WP04] Unexpected error in project membership get handler', { error });
    return formatToolResponse('error', `Failed to get project membership: ${error instanceof Error ? error.message : String(error)}`);
  }
};
