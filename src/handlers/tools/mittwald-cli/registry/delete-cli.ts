import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { logger } from '../../../../utils/logger.js';
import { deleteRegistry, LibraryError } from '@mittwald-mcp/cli-core';
import { validateToolParity } from '../../../../../tests/validation/parallel-validator.js';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';

interface MittwaldRegistryDeleteCliArgs {
  registryId: string;
  confirm?: boolean;
  quiet?: boolean;
  force?: boolean;
}

function buildCliArgs(args: MittwaldRegistryDeleteCliArgs): string[] {
  const cliArgs: string[] = ['registry', 'delete', args.registryId];

  if (args.quiet) cliArgs.push('--quiet');
  if (args.force) cliArgs.push('--force');

  return cliArgs;
}

export const handleRegistryDeleteCli: MittwaldCliToolHandler<MittwaldRegistryDeleteCliArgs> = async (args, sessionId) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  if (!args.registryId) {
    return formatToolResponse('error', 'Registry ID is required. Please provide the registryId parameter.');
  }

  if (args.confirm !== true) {
    return formatToolResponse(
      'error',
      'Registry deletion requires confirm=true. This operation is destructive and cannot be undone.'
    );
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  logger.warn('[RegistryDelete] Destructive operation attempted', {
    registryId: args.registryId,
    force: Boolean(args.force),
    sessionId: effectiveSessionId,
  });

  const argv = buildCliArgs(args);

  try {
    // WP05: Parallel validation - run both CLI and library
    const validation = await validateToolParity({
      toolName: 'mittwald_registry_delete',
      cliCommand: 'mw',
      cliArgs: [...argv, '--token', session.mittwaldAccessToken],
      libraryFn: async () => {
        return await deleteRegistry({
          registryId: args.registryId,
          apiToken: session.mittwaldAccessToken,
        });
      },
      ignoreFields: ['durationMs', 'duration', 'timestamp'],
    });

    // Log validation results
    if (!validation.passed) {
      logger.warn('[WP05 Validation] Output mismatch detected', {
        tool: 'mittwald_registry_delete',
        registryId: args.registryId,
        discrepancyCount: validation.discrepancies.length,
        discrepancies: validation.discrepancies,
        cliExitCode: validation.cliOutput.exitCode,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
      });
    } else {
      logger.info('[WP05 Validation] 100% parity achieved', {
        tool: 'mittwald_registry_delete',
        registryId: args.registryId,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
        speedup: `${((validation.cliOutput.durationMs / validation.libraryOutput.durationMs) * 100).toFixed(0)}%`,
      });
    }

    return formatToolResponse(
      'success',
      'Registry deleted successfully',
      {
        registryId: args.registryId,
        status: 'deleted',
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

    logger.error('[WP05] Unexpected error in registry delete handler', { error });
    return formatToolResponse('error', `Failed to delete registry: ${error instanceof Error ? error.message : String(error)}`);
  }
};
