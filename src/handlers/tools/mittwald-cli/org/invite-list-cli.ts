import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { parseJsonOutput } from '../../../../utils/cli-output.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';
import { listOrgInvites, LibraryError } from '@mittwald-mcp/cli-core';
import { validateToolParity } from '../../../../../tests/validation/parallel-validator.js';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';
import { logger } from '../../../../utils/logger.js';

export interface MittwaldOrgInviteListArgs {
  orgId?: string;
  output?: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
  extended?: boolean;
  noHeader?: boolean;
  noTruncate?: boolean;
  noRelativeDates?: boolean;
  csvSeparator?: ',' | ';';
}

interface BuildArgsResult {
  argv: string[];
  orgId: string;
  outputFormat: Required<MittwaldOrgInviteListArgs>['output'];
}

function resolveOrgId(args: MittwaldOrgInviteListArgs, context: unknown): string | undefined {
  return args.orgId || (context as { orgId?: string } | undefined)?.orgId;
}

function buildCliArgs(args: MittwaldOrgInviteListArgs, orgId: string): BuildArgsResult {
  const outputFormat = args.output ?? 'txt';
  const argv: string[] = ['org', 'invite', 'list', '--org-id', orgId, '--output', outputFormat];

  if (args.extended) argv.push('--extended');
  if (args.noHeader) argv.push('--no-header');
  if (args.noTruncate) argv.push('--no-truncate');
  if (args.noRelativeDates) argv.push('--no-relative-dates');
  if (args.csvSeparator && (outputFormat === 'csv' || outputFormat === 'tsv')) {
    argv.push('--csv-separator', args.csvSeparator);
  }

  return { argv, orgId, outputFormat };
}

function mapCliError(error: CliToolError, orgId: string): string {
  const combined = `${error.stdout ?? ''}\n${error.stderr ?? ''}`.toLowerCase();
  const errorMessage = error.stderr || error.stdout || error.message;

  if (combined.includes('not found')) {
    return `Organization not found: ${orgId}.\nError: ${errorMessage}`;
  }

  if (combined.includes('permission denied') || combined.includes('forbidden')) {
    return `Permission denied when listing organization invites.\nError: ${errorMessage}`;
  }

  return `Failed to list organization invites: ${errorMessage}`;
}

export const handleOrgInviteListCli: MittwaldToolHandler<MittwaldOrgInviteListArgs> = async (args, context) => {
  const orgId = resolveOrgId(args, context.orgContext);
  if (!orgId) {
    return formatToolResponse('error', 'Organization ID is required. Either provide it as a parameter or set a default org in the context.');
  }

  const effectiveSessionId = context?.sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  const { argv, outputFormat } = buildCliArgs(args, orgId);

  try {
    // WP05: Parallel validation - run both CLI and library
    const validation = await validateToolParity({
      toolName: 'mittwald_org_invite_list',
      cliCommand: 'mw',
      cliArgs: [...argv, '--token', session.mittwaldAccessToken],
      libraryFn: async () => {
        return await listOrgInvites({
          customerId: orgId,
          apiToken: session.mittwaldAccessToken,
        });
      },
      ignoreFields: ['durationMs', 'duration', 'timestamp'],
    });

    // Log validation results
    if (!validation.passed) {
      logger.warn('[WP05 Validation] Output mismatch detected', {
        tool: 'mittwald_org_invite_list',
        orgId,
        discrepancyCount: validation.discrepancies.length,
        discrepancies: validation.discrepancies,
        cliExitCode: validation.cliOutput.exitCode,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
      });
    } else {
      logger.info('[WP05 Validation] 100% parity achieved', {
        tool: 'mittwald_org_invite_list',
        orgId,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
        speedup: `${((validation.cliOutput.durationMs / validation.libraryOutput.durationMs) * 100).toFixed(0)}%`,
      });
    }

    // Use library result (it's validated) - data is array directly
    const data = validation.libraryOutput.data as any[];
    const count = Array.isArray(data) ? data.length : 0;

    return formatToolResponse(
      'success',
      `Found ${count} organization invite(s)`,
      data,
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
      const message = mapCliError(error, orgId);
      return formatToolResponse('error', message, {
        exitCode: error.exitCode,
        stderr: error.stderr,
        stdout: error.stdout,
        suggestedAction: error.suggestedAction,
      });
    }

    logger.error('[WP05] Unexpected error in org invite list handler', { error });
    return formatToolResponse('error', `Failed to list organization invites: ${error instanceof Error ? error.message : String(error)}`);
  }
};
