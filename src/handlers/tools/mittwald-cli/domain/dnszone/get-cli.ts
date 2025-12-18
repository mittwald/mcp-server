import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../../tools/index.js';
import { getDnsZone, LibraryError } from '@mittwald-mcp/cli-core';
import { validateToolParity } from '../../../../../../tests/validation/parallel-validator.js';
import { sessionManager } from '../../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../../utils/execution-context.js';
import { logger } from '../../../../../utils/logger.js';

interface MittwaldDomainDnszoneGetArgs {
  dnszoneId: string;
  output?: 'txt' | 'json' | 'yaml';
}

function buildCliArgs(args: MittwaldDomainDnszoneGetArgs): string[] {
  return ['domain', 'dnszone', 'get', args.dnszoneId, '--output', 'json'];
}

interface ParsedDnszoneResult {
  item?: Record<string, any>;
  error?: string;
}

function parseDnszone(output: string): ParsedDnszoneResult {
  if (!output) return { error: 'Empty output received from CLI command' };

  try {
    const parsed = JSON.parse(output);
    return typeof parsed === 'object' && parsed !== null ? { item: parsed as Record<string, any> } : { error: 'Unexpected output format from CLI command' };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

function mapCliError(error: CliToolError, args: MittwaldDomainDnszoneGetArgs): string {
  const combined = `${error.stderr ?? ''} ${error.stdout ?? ''}`.toLowerCase();

  if (combined.includes('not found') && combined.includes('zone')) {
    return `DNS zone not found: ${args.dnszoneId}.\nError: ${error.stderr || error.message}`;
  }

  return error.message;
}

export const handleDomainDnszoneGetCli: MittwaldCliToolHandler<MittwaldDomainDnszoneGetArgs> = async (args, sessionId) => {
  if (!args.dnszoneId) {
    return formatToolResponse('error', 'DNS zone ID is required.');
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
    // WP05: Parallel validation - run both CLI and library
    const validation = await validateToolParity({
      toolName: 'mittwald_domain_dnszone_get',
      cliCommand: 'mw',
      cliArgs: [...argv, '--token', session.mittwaldAccessToken],
      libraryFn: async () => {
        return await getDnsZone({
          dnsZoneId: args.dnszoneId,
          apiToken: session.mittwaldAccessToken,
        });
      },
      ignoreFields: ['durationMs', 'duration', 'timestamp'],
    });

    // Log validation results
    if (!validation.passed) {
      logger.warn('[WP05 Validation] Output mismatch detected', {
        tool: 'mittwald_domain_dnszone_get',
        dnszoneId: args.dnszoneId,
        discrepancyCount: validation.discrepancies.length,
        discrepancies: validation.discrepancies,
        cliExitCode: validation.cliOutput.exitCode,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
      });
    } else {
      logger.info('[WP05 Validation] 100% parity achieved', {
        tool: 'mittwald_domain_dnszone_get',
        dnszoneId: args.dnszoneId,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
        speedup: `${((validation.cliOutput.durationMs / validation.libraryOutput.durationMs) * 100).toFixed(0)}%`,
      });
    }

    // Use library result (it's validated)
    const item = validation.libraryOutput.data as any;

    const formattedData = {
      id: item.id,
      domainName: item.domainName,
      projectId: item.projectId,
      recordCount: item.recordCount,
      zone: item.zone,
      domain: item.domain,
      records: item.records || [],
    };

    return formatToolResponse(
      'success',
      `DNS zone information retrieved for ${args.dnszoneId}`,
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

    logger.error('[WP05] Unexpected error in domain dnszone get handler', { error });
    return formatToolResponse('error', `Failed to get DNS zone: ${error instanceof Error ? error.message : String(error)}`);
  }
};
