import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';
import { getDomain, LibraryError } from '@mittwald-mcp/cli-core';
import { validateToolParity } from '../../../../../tests/validation/parallel-validator.js';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';
import { logger } from '../../../../utils/logger.js';

interface MittwaldDomainGetArgs {
  domainId: string;
  output?: 'txt' | 'json' | 'yaml';
}

function buildCliArgs(args: MittwaldDomainGetArgs): string[] {
  return ['domain', 'get', args.domainId, '--output', 'json'];
}

function mapCliError(error: CliToolError, args: MittwaldDomainGetArgs): string {
  const combined = `${error.stderr ?? ''} ${error.stdout ?? ''}`.toLowerCase();

  if (combined.includes('not found') && combined.includes('domain')) {
    return `Domain not found: ${args.domainId}.\nError: ${error.stderr || error.message}`;
  }

  return error.message;
}

export const handleDomainGetCli: MittwaldCliToolHandler<MittwaldDomainGetArgs> = async (args, sessionId) => {
  if (!args.domainId) {
    return formatToolResponse('error', 'Domain ID is required.');
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
      toolName: 'mittwald_domain_get',
      cliCommand: 'mw',
      cliArgs: [...argv, '--token', session.mittwaldAccessToken],
      libraryFn: async () => {
        return await getDomain({
          domainId: args.domainId,
          apiToken: session.mittwaldAccessToken,
        });
      },
      ignoreFields: ['durationMs', 'duration', 'timestamp'],
    });

    // Log validation results
    if (!validation.passed) {
      logger.warn('[WP04 Validation] Output mismatch detected', {
        tool: 'mittwald_domain_get',
        domainId: args.domainId,
        discrepancyCount: validation.discrepancies.length,
        discrepancies: validation.discrepancies,
        cliExitCode: validation.cliOutput.exitCode,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
      });
    } else {
      logger.info('[WP04 Validation] 100% parity achieved', {
        tool: 'mittwald_domain_get',
        domainId: args.domainId,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
        speedup: `${((validation.cliOutput.durationMs / validation.libraryOutput.durationMs) * 100).toFixed(0)}%`,
      });
    }

    // Use library result (it's validated)
    const domain = validation.libraryOutput.data as any;

    const formattedData = {
      domain: domain.domain,
      connected: domain.connected,
      deleted: domain.deleted,
      nameservers: domain.nameservers,
      usesDefaultNameserver: domain.usesDefaultNameserver,
      projectId: domain.projectId,
      contactHash: domain.contactHash,
      authCode: domain.authCode,
      id: domain.id,
    };

    return formatToolResponse(
      'success',
      `Domain information retrieved for ${args.domainId}`,
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

    logger.error('[WP04] Unexpected error in domain get handler', { error });
    return formatToolResponse('error', `Failed to get domain: ${error instanceof Error ? error.message : String(error)}`);
  }
};
