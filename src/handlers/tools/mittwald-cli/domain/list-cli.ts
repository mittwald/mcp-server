import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';
import { listDomains, LibraryError } from '@mittwald-mcp/cli-core';
import { validateToolParity } from '../../../../../tests/validation/parallel-validator.js';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';
import { logger } from '../../../../utils/logger.js';

interface MittwaldDomainListArgs {
  projectId?: string;
  output?: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
  extended?: boolean;
  noHeader?: boolean;
  noTruncate?: boolean;
  noRelativeDates?: boolean;
  csvSeparator?: ',' | ';';
}

function buildCliArgs(args: MittwaldDomainListArgs): string[] {
  const cliArgs: string[] = ['domain', 'list'];

  // Enforce JSON output for deterministic parsing; CLI ignores duplicate flags.
  cliArgs.push('--output', 'json');

  if (args.projectId) cliArgs.push('--project-id', args.projectId);
  if (args.extended) cliArgs.push('--extended');
  if (args.noHeader) cliArgs.push('--no-header');
  if (args.noTruncate) cliArgs.push('--no-truncate');
  if (args.noRelativeDates) cliArgs.push('--no-relative-dates');
  if (args.csvSeparator && args.output === 'csv') cliArgs.push('--csv-separator', args.csvSeparator);

  return cliArgs;
}

type RawDomainListItem = {
  domain?: string;
  connected?: boolean;
  deleted?: boolean;
  nameservers?: string[];
  usesDefaultNameserver?: boolean;
  projectId?: string;
  contactHash?: string;
  authCode?: string;
};

function mapCliError(error: CliToolError, args: MittwaldDomainListArgs): string {
  const combined = `${error.stderr ?? ''} ${error.stdout ?? ''}`.toLowerCase();

  if (combined.includes('not found') && combined.includes('project')) {
    return `Project not found. Please verify the project ID: ${args.projectId ?? 'not specified'}.\nError: ${error.stderr || error.message}`;
  }

  return error.message;
}

export const handleDomainListCli: MittwaldCliToolHandler<MittwaldDomainListArgs> = async (args, sessionId) => {
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
      toolName: 'mittwald_domain_list',
      cliCommand: 'mw',
      cliArgs: [...argv, '--token', session.mittwaldAccessToken],
      libraryFn: async () => {
        return await listDomains({
          projectId: args.projectId,
          apiToken: session.mittwaldAccessToken,
        });
      },
      ignoreFields: ['durationMs', 'duration', 'timestamp'],
    });

    // Log validation results
    if (!validation.passed) {
      logger.warn('[WP04 Validation] Output mismatch detected', {
        tool: 'mittwald_domain_list',
        projectId: args.projectId,
        discrepancyCount: validation.discrepancies.length,
        discrepancies: validation.discrepancies,
        cliExitCode: validation.cliOutput.exitCode,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
      });
    } else {
      logger.info('[WP04 Validation] 100% parity achieved', {
        tool: 'mittwald_domain_list',
        projectId: args.projectId,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
        speedup: `${((validation.cliOutput.durationMs / validation.libraryOutput.durationMs) * 100).toFixed(0)}%`,
      });
    }

    // Use library result (it's validated) - data is array directly
    const domains = validation.libraryOutput.data as any[];

    if (!domains || domains.length === 0) {
      return formatToolResponse(
        'success',
        'No domains found',
        [],
        {
          durationMs: validation.libraryOutput.durationMs,
          validationPassed: validation.passed,
          cliDuration: validation.cliOutput.durationMs,
          libraryDuration: validation.libraryOutput.durationMs,
        }
      );
    }

    const formatted = domains.map((item) => ({
      domain: item.domain,
      connected: item.connected,
      deleted: item.deleted,
      nameservers: item.nameservers,
      usesDefaultNameserver: item.usesDefaultNameserver,
      projectId: item.projectId,
      contactHash: item.contactHash,
      authCode: item.authCode,
    }));

    return formatToolResponse(
      'success',
      `Found ${formatted.length} domain(s)`,
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

    logger.error('[WP04] Unexpected error in domain list handler', { error });
    return formatToolResponse('error', `Failed to list domains: ${error instanceof Error ? error.message : String(error)}`);
  }
};
