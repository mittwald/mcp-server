import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';
import { getVirtualHost, LibraryError } from '@mittwald-mcp/cli-core';
import { validateToolParity } from '../../../../../tests/validation/parallel-validator.js';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';
import { logger } from '../../../../utils/logger.js';

interface MittwaldDomainVirtualhostGetArgs {
  virtualhostId: string;
  output?: 'txt' | 'json' | 'yaml';
}

function buildCliArgs(args: MittwaldDomainVirtualhostGetArgs): string[] {
  return ['domain', 'virtualhost', 'get', args.virtualhostId, '--output', 'json'];
}

function mapCliError(error: CliToolError, args: MittwaldDomainVirtualhostGetArgs): string {
  const combined = `${error.stderr ?? ''} ${error.stdout ?? ''}`;

  if (/not found/i.test(combined)) {
    return `Virtual host not found: ${args.virtualhostId}.\nError: ${error.stderr || error.stdout || error.message}`;
  }

  if (/403|forbidden|permission denied/i.test(combined)) {
    return `Permission denied when retrieving virtual host. Complete OAuth sign-in and ensure the Mittwald CLI is authenticated.\nError: ${error.stderr || error.stdout || error.message}`;
  }

  return `Failed to get virtual host: ${error.stderr || error.stdout || error.message}`;
}

export const handleDomainVirtualhostGetCli: MittwaldCliToolHandler<MittwaldDomainVirtualhostGetArgs> = async (args, sessionId) => {
  if (!args.virtualhostId) {
    return formatToolResponse('error', 'Virtual host ID is required.');
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
      toolName: 'mittwald_domain_virtualhost_get',
      cliCommand: 'mw',
      cliArgs: [...argv, '--token', session.mittwaldAccessToken],
      libraryFn: async () => {
        return await getVirtualHost({
          ingressId: args.virtualhostId,
          apiToken: session.mittwaldAccessToken,
        });
      },
      ignoreFields: ['durationMs', 'duration', 'timestamp'],
    });

    // Log validation results
    if (!validation.passed) {
      logger.warn('[WP04 Validation] Output mismatch detected', {
        tool: 'mittwald_domain_virtualhost_get',
        virtualhostId: args.virtualhostId,
        discrepancyCount: validation.discrepancies.length,
        discrepancies: validation.discrepancies,
        cliExitCode: validation.cliOutput.exitCode,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
      });
    } else {
      logger.info('[WP04 Validation] 100% parity achieved', {
        tool: 'mittwald_domain_virtualhost_get',
        virtualhostId: args.virtualhostId,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
        speedup: `${((validation.cliOutput.durationMs / validation.libraryOutput.durationMs) * 100).toFixed(0)}%`,
      });
    }

    // Use library result (it's validated)
    const virtualhost = validation.libraryOutput.data as any;

    const formattedData = {
      id: virtualhost.id,
      hostname: virtualhost.hostname,
      projectId: virtualhost.projectId,
      paths: virtualhost.paths,
      status: virtualhost.status,
      ips: virtualhost.ips,
      dnsValidationErrors: virtualhost.dnsValidationErrors ?? [],
    };

    return formatToolResponse(
      'success',
      `Virtual host details for ${formattedData.hostname ?? args.virtualhostId}`,
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

    logger.error('[WP04] Unexpected error in virtualhost get handler', { error });
    return formatToolResponse('error', `Failed to get virtual host: ${error instanceof Error ? error.message : String(error)}`);
  }
};
