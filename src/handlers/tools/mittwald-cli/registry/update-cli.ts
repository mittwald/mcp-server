import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { updateRegistry, LibraryError } from '@mittwald-mcp/cli-core';
import { validateToolParity } from '../../../../../tests/validation/parallel-validator.js';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';
import { logger } from '../../../../utils/logger.js';

interface MittwaldRegistryUpdateCliArgs {
  registryId: string;
  quiet?: boolean;
  description?: string;
  uri?: string;
  username?: string;
  password?: string;
}

function buildCliArgs(args: MittwaldRegistryUpdateCliArgs): string[] {
  const cliArgs: string[] = ['registry', 'update', args.registryId];

  if (args.quiet) cliArgs.push('--quiet');
  if (args.description) cliArgs.push('--description', args.description);
  if (args.uri) cliArgs.push('--uri', args.uri);
  if (args.username) cliArgs.push('--username', args.username);
  if (args.password) cliArgs.push('--password', args.password);

  return cliArgs;
}

function buildUpdateSummary(args: MittwaldRegistryUpdateCliArgs) {
  return {
    description: args.description,
    uri: args.uri,
    username: args.username,
  };
}

export const handleRegistryUpdateCli: MittwaldCliToolHandler<MittwaldRegistryUpdateCliArgs> = async (args, sessionId) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  if (!args.registryId) {
    return formatToolResponse('error', 'Registry ID is required. Please provide the registryId parameter.');
  }

  if (!args.description && !args.uri && !args.username && !args.password) {
    return formatToolResponse('error', 'At least one update parameter must be provided (description, uri, username, password).');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  const argv = buildCliArgs(args);

  try {
    // WP05: Parallel validation - run both CLI and library
    // Note: Library only supports description updates currently
    const validation = await validateToolParity({
      toolName: 'mittwald_registry_update',
      cliCommand: 'mw',
      cliArgs: [...argv, '--token', session.mittwaldAccessToken],
      libraryFn: async () => {
        if (!args.description) {
          throw new Error('Library function only supports description updates');
        }
        return await updateRegistry({
          registryId: args.registryId,
          description: args.description,
          apiToken: session.mittwaldAccessToken,
        });
      },
      ignoreFields: ['durationMs', 'duration', 'timestamp'],
    });

    // Log validation results
    if (!validation.passed) {
      logger.warn('[WP05 Validation] Output mismatch detected', {
        tool: 'mittwald_registry_update',
        registryId: args.registryId,
        discrepancyCount: validation.discrepancies.length,
        discrepancies: validation.discrepancies,
        cliExitCode: validation.cliOutput.exitCode,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
      });
    } else {
      logger.info('[WP05 Validation] 100% parity achieved', {
        tool: 'mittwald_registry_update',
        registryId: args.registryId,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
        speedup: `${((validation.cliOutput.durationMs / validation.libraryOutput.durationMs) * 100).toFixed(0)}%`,
      });
    }

    const updates = buildUpdateSummary(args);

    return formatToolResponse(
      'success',
      'Registry updated successfully',
      {
        registryId: args.registryId,
        status: 'updated',
        updates,
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

    logger.error('[WP05] Unexpected error in registry update handler', { error });
    return formatToolResponse('error', `Failed to update registry: ${error instanceof Error ? error.message : String(error)}`);
  }
};
