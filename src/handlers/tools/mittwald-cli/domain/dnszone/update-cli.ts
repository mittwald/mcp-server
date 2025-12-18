import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../../tools/index.js';
import { updateDnsZone, LibraryError } from '@mittwald-mcp/cli-core';
import { validateToolParity } from '../../../../../../tests/validation/parallel-validator.js';
import { sessionManager } from '../../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../../utils/execution-context.js';
import { logger } from '../../../../../utils/logger.js';

interface MittwaldDomainDnszoneUpdateArgs {
  dnszoneId: string;
  recordSet: 'a' | 'mx' | 'txt' | 'srv' | 'cname';
  projectId?: string;
  set?: string[];
  recordId?: string;
  unset?: string[];
  quiet?: boolean;
  managed?: boolean;
  record?: string[];
  ttl?: number;
}

function buildCliArgs(args: MittwaldDomainDnszoneUpdateArgs): string[] {
  const cliArgs: string[] = ['domain', 'dnszone', 'update', args.dnszoneId, args.recordSet];

  if (args.projectId) cliArgs.push('--project-id', args.projectId);
  if (args.quiet) cliArgs.push('--quiet');
  if (args.managed) cliArgs.push('--managed');
  if (args.unset) cliArgs.push('--unset');
  if (args.record) {
    for (const record of args.record) {
      cliArgs.push('--record', record);
    }
  }
  if (args.ttl !== undefined) cliArgs.push('--ttl', String(args.ttl));

  return cliArgs;
}

function mapCliError(error: CliToolError, args: MittwaldDomainDnszoneUpdateArgs): string {
  const combined = `${error.stderr ?? ''}\n${error.stdout ?? ''}`.toLowerCase();
  const baseMessage = error.stderr || error.stdout || error.message;

  if (combined.includes('not found') && combined.includes('zone')) {
    return `DNS zone not found: ${args.dnszoneId}.\nError: ${baseMessage}`;
  }

  return `Failed to update DNS zone: ${baseMessage}`;
}

export const handleDomainDnszoneUpdateCli: MittwaldCliToolHandler<MittwaldDomainDnszoneUpdateArgs> = async (
  args,
  sessionId,
) => {
  if (!args.dnszoneId) {
    return formatToolResponse('error', 'DNS zone ID is required.');
  }

  if (!args.recordSet) {
    return formatToolResponse('error', 'Record set type is required.');
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
      toolName: 'mittwald_domain_dnszone_update',
      cliCommand: 'mw',
      cliArgs: [...argv, '--token', session.mittwaldAccessToken],
      libraryFn: async () => {
        // Build recordSet payload for library
        const recordSetPayload: any = {
          [args.recordSet]: {
            records: args.record || [],
          },
        };

        if (args.ttl !== undefined) {
          recordSetPayload[args.recordSet].ttl = args.ttl;
        }

        if (args.managed !== undefined) {
          recordSetPayload[args.recordSet].managed = args.managed;
        }

        return await updateDnsZone({
          dnsZoneId: args.dnszoneId,
          recordSetType: args.recordSet,
          recordSet: recordSetPayload,
          apiToken: session.mittwaldAccessToken,
        });
      },
      ignoreFields: ['durationMs', 'duration', 'timestamp'],
    });

    // Log validation results
    if (!validation.passed) {
      logger.warn('[WP05 Validation] Output mismatch detected', {
        tool: 'mittwald_domain_dnszone_update',
        dnszoneId: args.dnszoneId,
        recordSet: args.recordSet,
        discrepancyCount: validation.discrepancies.length,
        discrepancies: validation.discrepancies,
        cliExitCode: validation.cliOutput.exitCode,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
      });
    } else {
      logger.info('[WP05 Validation] 100% parity achieved', {
        tool: 'mittwald_domain_dnszone_update',
        dnszoneId: args.dnszoneId,
        recordSet: args.recordSet,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
        speedup: `${((validation.cliOutput.durationMs / validation.libraryOutput.durationMs) * 100).toFixed(0)}%`,
      });
    }

    // DNS zone update returns void (204 No Content), so we build a success payload
    const payload = {
      success: true,
      message: `DNS zone ${args.dnszoneId} record set '${args.recordSet}' updated successfully`,
      dnszoneId: args.dnszoneId,
      recordSet: args.recordSet,
      recordsSet: args.record || null,
      ttl: args.ttl ?? null,
      managed: args.managed ?? false,
      unset: args.unset ?? false,
    };

    return formatToolResponse(
      'success',
      `DNS zone ${args.dnszoneId} record set '${args.recordSet}' updated successfully`,
      payload,
      {
        durationMs: validation.libraryOutput.durationMs,
        validationPassed: validation.passed,
        discrepancyCount: validation.discrepancies.length,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
      },
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

    logger.error('[WP05] Unexpected error in domain dnszone update handler', { error });
    return formatToolResponse(
      'error',
      `Failed to update DNS zone: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
};
