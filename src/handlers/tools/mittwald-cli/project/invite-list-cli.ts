import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { parseJsonOutput } from '../../../../utils/cli-output.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';
import { listProjectInvites, LibraryError } from '@mittwald-mcp/cli-core';
import { validateToolParity } from '../../../../../tests/validation/parallel-validator.js';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';
import { logger } from '../../../../utils/logger.js';

export interface MittwaldProjectInviteListArgs {
  projectId?: string;
  output?: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
  extended?: boolean;
  noHeader?: boolean;
  noTruncate?: boolean;
  noRelativeDates?: boolean;
  csvSeparator?: ',' | ';';
}

function buildCliArgs(args: MittwaldProjectInviteListArgs): string[] {
  const cliArgs: string[] = ['project', 'invite', 'list', '--output', 'json'];

  if (args.projectId) cliArgs.push('--project-id', args.projectId);
  if (args.extended) cliArgs.push('--extended');
  if (args.noHeader) cliArgs.push('--no-header');
  if (args.noTruncate) cliArgs.push('--no-truncate');
  if (args.noRelativeDates) cliArgs.push('--no-relative-dates');
  if (args.csvSeparator) cliArgs.push('--csv-separator', args.csvSeparator);

  return cliArgs;
}

function mapCliError(error: CliToolError, args: MittwaldProjectInviteListArgs): string {
  const combined = `${error.stderr ?? ''}\n${error.stdout ?? ''}`.toLowerCase();
  const errorText = error.stderr || error.stdout || error.message;

  if (combined.includes('not found') && combined.includes('project')) {
    return `Project not found. Please verify the project ID: ${args.projectId || 'not specified'}.\nError: ${errorText}`;
  }

  return `Failed to list project invites: ${errorText}`;
}

export const handleProjectInviteListCli: MittwaldCliToolHandler<MittwaldProjectInviteListArgs> = async (args, sessionId) => {
  if (!args.projectId) {
    return formatToolResponse('error', 'projectId is required');
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
      toolName: 'mittwald_project_invite_list',
      cliCommand: 'mw',
      cliArgs: [...argv, '--token', session.mittwaldAccessToken],
      libraryFn: async () => {
        return await listProjectInvites({
          projectId: args.projectId!,
          apiToken: session.mittwaldAccessToken,
        });
      },
      ignoreFields: ['durationMs', 'duration', 'timestamp'],
    });

    // Log validation results
    if (!validation.passed) {
      logger.warn('[WP04 Validation] Output mismatch detected', {
        tool: 'mittwald_project_invite_list',
        projectId: args.projectId,
        discrepancyCount: validation.discrepancies.length,
        discrepancies: validation.discrepancies,
        cliExitCode: validation.cliOutput.exitCode,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
      });
    } else {
      logger.info('[WP04 Validation] 100% parity achieved', {
        tool: 'mittwald_project_invite_list',
        projectId: args.projectId,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
        speedup: `${((validation.cliOutput.durationMs / validation.libraryOutput.durationMs) * 100).toFixed(0)}%`,
      });
    }

    // Use library result (it's validated) - data is array directly
    const invites = validation.libraryOutput.data as any[];

    if (!invites || invites.length === 0) {
      return formatToolResponse(
        'success',
        'No project invites found',
        [],
        {
          durationMs: validation.libraryOutput.durationMs,
          validationPassed: validation.passed,
          cliDuration: validation.cliOutput.durationMs,
          libraryDuration: validation.libraryOutput.durationMs,
        }
      );
    }

    const formattedData = invites.map((item: any) => ({
      id: item.id,
      email: item.mailAddress || item.email,
      role: item.projectRole || item.role,
      status: item.expired ? 'expired' : 'active',
      createdAt: item.createdAt,
      expiresAt: item.membershipExpiresAt || item.expiresAt || 'Never',
      projectId: item.projectId,
      userId: item.userId,
    }));

    return formatToolResponse(
      'success',
      `Found ${invites.length} project invite(s)`,
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

    logger.error('[WP04] Unexpected error in project invite list handler', { error });
    return formatToolResponse('error', `Failed to list project invites: ${error instanceof Error ? error.message : String(error)}`);
  }
};
