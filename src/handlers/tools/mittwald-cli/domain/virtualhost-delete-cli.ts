import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { logger } from '../../../../utils/logger.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';
import { deleteVirtualHost, LibraryError } from '@mittwald-mcp/cli-core';
import { validateToolParity } from '../../../../../tests/validation/parallel-validator.js';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';

interface MittwaldDomainVirtualhostDeleteArgs {
  virtualhostId: string;
  confirm?: boolean;
  force?: boolean;
}

function buildCliArgs(args: MittwaldDomainVirtualhostDeleteArgs): string[] {
  const cliArgs: string[] = ['domain', 'virtualhost', 'delete', args.virtualhostId];
  if (args.force) cliArgs.push('--force');
  return cliArgs;
}

function mapCliError(error: CliToolError, args: MittwaldDomainVirtualhostDeleteArgs): string {
  const combined = `${error.stderr ?? ''} ${error.stdout ?? ''}`;

  if (/not found/i.test(combined)) {
    return `Virtual host not found: ${args.virtualhostId}.\nError: ${error.stderr || error.stdout || error.message}`;
  }

  if (/403|forbidden|permission denied/i.test(combined)) {
    return `Permission denied when deleting virtual host. Complete OAuth sign-in and ensure the Mittwald CLI is authenticated.\nError: ${error.stderr || error.stdout || error.message}`;
  }

  return `Failed to delete virtual host: ${error.stderr || error.stdout || error.message}`;
}

export const handleDomainVirtualhostDeleteCli: MittwaldCliToolHandler<MittwaldDomainVirtualhostDeleteArgs> = async (args, sessionId) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();
  const resolvedSessionId = typeof sessionId === 'string' ? sessionId : (sessionId as any)?.sessionId;
  const resolvedUserId = typeof sessionId === 'string' ? undefined : (sessionId as any)?.userId;

  if (!args.virtualhostId) {
    return formatToolResponse('error', 'Virtual host ID is required.');
  }

  if (args.confirm !== true) {
    return formatToolResponse(
      'error',
      'Virtual host deletion requires confirm=true. This operation is destructive and cannot be undone.'
    );
  }

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  logger.warn('[DomainVirtualhostDelete] Destructive operation attempted', {
    virtualhostId: args.virtualhostId,
    force: Boolean(args.force),
    sessionId: resolvedSessionId,
    ...(resolvedUserId ? { userId: resolvedUserId } : {}),
  });

  const argv = buildCliArgs(args);

  try {
    // WP04: Parallel validation - run both CLI and library
    const validation = await validateToolParity({
      toolName: 'mittwald_domain_virtualhost_delete',
      cliCommand: 'mw',
      cliArgs: [...argv, '--token', session.mittwaldAccessToken],
      libraryFn: async () => {
        return await deleteVirtualHost({
          ingressId: args.virtualhostId,
          apiToken: session.mittwaldAccessToken,
        });
      },
      ignoreFields: ['durationMs', 'duration', 'timestamp'],
    });

    // Log validation results
    if (!validation.passed) {
      logger.warn('[WP04 Validation] Output mismatch detected', {
        tool: 'mittwald_domain_virtualhost_delete',
        virtualhostId: args.virtualhostId,
        discrepancyCount: validation.discrepancies.length,
        discrepancies: validation.discrepancies,
        cliExitCode: validation.cliOutput.exitCode,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
      });
    } else {
      logger.info('[WP04 Validation] 100% parity achieved', {
        tool: 'mittwald_domain_virtualhost_delete',
        virtualhostId: args.virtualhostId,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
        speedup: `${((validation.cliOutput.durationMs / validation.libraryOutput.durationMs) * 100).toFixed(0)}%`,
      });
    }

    return formatToolResponse(
      'success',
      `Successfully deleted virtual host ${args.virtualhostId}`,
      {
        deletedId: args.virtualhostId,
        force: args.force ?? false,
      },
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

    logger.error('[WP04] Unexpected error in virtualhost delete handler', { error });
    return formatToolResponse('error', `Failed to delete virtual host: ${error instanceof Error ? error.message : String(error)}`);
  }
};
