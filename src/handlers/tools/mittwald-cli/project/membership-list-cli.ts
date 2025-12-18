import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';
import { listProjectMemberships, LibraryError } from '@mittwald-mcp/cli-core';
import { validateToolParity } from '../../../../../tests/validation/parallel-validator.js';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';
import { logger } from '../../../../utils/logger.js';

export interface MittwaldProjectMembershipListArgs {
  projectId: string;
  output?: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
  extended?: boolean;
  noHeader?: boolean;
  noTruncate?: boolean;
  noRelativeDates?: boolean;
  csvSeparator?: ',' | ';';
}

function buildCliArgs(args: MittwaldProjectMembershipListArgs): string[] {
  const cliArgs: string[] = ['project', 'membership', 'list', '--output', 'json', '--project-id', args.projectId];

  if (args.extended) cliArgs.push('--extended');
  if (args.noHeader) cliArgs.push('--no-header');
  if (args.noTruncate) cliArgs.push('--no-truncate');
  if (args.noRelativeDates) cliArgs.push('--no-relative-dates');
  if (args.csvSeparator) cliArgs.push('--csv-separator', args.csvSeparator);

  return cliArgs;
}

function mapCliError(error: CliToolError, args: MittwaldProjectMembershipListArgs): string {
  const stderr = error.stderr ?? '';
  const stdout = error.stdout ?? '';
  const combined = `${stderr}\n${stdout}\n${error.message}`.toLowerCase();

  if (combined.includes('not found') && combined.includes('project')) {
    const details = stderr || stdout || error.message;
    return `Project not found. Please verify the project ID: ${args.projectId}.\nError: ${details}`;
  }

  if (error.kind === 'AUTHENTICATION' || combined.includes('not authenticated') || combined.includes('401')) {
    const details = stderr || stdout || error.message;
    return `Authentication failed. Complete OAuth sign-in and ensure the Mittwald CLI is authenticated.\nError: ${details}`;
  }

  if (combined.includes('forbidden') || combined.includes('403')) {
    const details = stderr || stdout || error.message;
    return `Access denied. You don't have permission to view project memberships.\nError: ${details}`;
  }

  const details = stderr || stdout || error.message;
  return `Failed to list project memberships: ${details}`;
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
  };
}

export const handleProjectMembershipListCli: MittwaldCliToolHandler<MittwaldProjectMembershipListArgs> = async (args, sessionId) => {
  if (!args.projectId) {
    return formatToolResponse('error', 'Project ID is required.');
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
      toolName: 'mittwald_project_membership_list',
      cliCommand: 'mw',
      cliArgs: [...argv, '--token', session.mittwaldAccessToken],
      libraryFn: async () => {
        return await listProjectMemberships({
          projectId: args.projectId,
          apiToken: session.mittwaldAccessToken,
        });
      },
      ignoreFields: ['durationMs', 'duration', 'timestamp'],
    });

    // Log validation results
    if (!validation.passed) {
      logger.warn('[WP04 Validation] Output mismatch detected', {
        tool: 'mittwald_project_membership_list',
        projectId: args.projectId,
        discrepancyCount: validation.discrepancies.length,
        discrepancies: validation.discrepancies,
        cliExitCode: validation.cliOutput.exitCode,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
      });
    } else {
      logger.info('[WP04 Validation] 100% parity achieved', {
        tool: 'mittwald_project_membership_list',
        projectId: args.projectId,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
        speedup: `${((validation.cliOutput.durationMs / validation.libraryOutput.durationMs) * 100).toFixed(0)}%`,
      });
    }

    // Use library result (it's validated) - data is array directly
    const memberships = validation.libraryOutput.data as any[];

    if (!memberships || memberships.length === 0) {
      return formatToolResponse(
        'success',
        'No project memberships found',
        [],
        {
          durationMs: validation.libraryOutput.durationMs,
          validationPassed: validation.passed,
          cliDuration: validation.cliOutput.durationMs,
          libraryDuration: validation.libraryOutput.durationMs,
        }
      );
    }

    const formatted = memberships.map((item) => formatMembership((item ?? {}) as Record<string, unknown>));

    return formatToolResponse(
      'success',
      `Found ${formatted.length} project membership(s)`,
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

    logger.error('[WP04] Unexpected error in project membership list handler', { error });
    return formatToolResponse('error', `Failed to list project memberships: ${error instanceof Error ? error.message : String(error)}`);
  }
};
