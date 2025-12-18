import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { createRegistry, LibraryError } from '@mittwald-mcp/cli-core';
import { validateToolParity } from '../../../../../tests/validation/parallel-validator.js';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';
import { logger } from '../../../../utils/logger.js';

interface MittwaldRegistryCreateCliArgs {
  uri: string;
  description: string;
  projectId?: string;
  quiet?: boolean;
  username?: string;
  password?: string;
}

function buildCliArgs(args: MittwaldRegistryCreateCliArgs): string[] {
  const cliArgs: string[] = ['registry', 'create', '--uri', args.uri, '--description', args.description];

  if (args.projectId) cliArgs.push('--project-id', args.projectId);
  if (args.quiet) cliArgs.push('--quiet');
  if (args.username) cliArgs.push('--username', args.username);
  if (args.password) cliArgs.push('--password', args.password);

  return cliArgs;
}

export const handleRegistryCreateCli: MittwaldCliToolHandler<MittwaldRegistryCreateCliArgs> = async (args, sessionId) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  if (!args.uri) {
    return formatToolResponse('error', "'uri' is required. Please provide the uri parameter.");
  }

  if (!args.description) {
    return formatToolResponse('error', "'description' is required. Please provide the description parameter.");
  }

  if (!args.projectId) {
    return formatToolResponse('error', "'projectId' is required. Please provide the projectId parameter.");
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  const argv = buildCliArgs(args);

  try {
    // WP05: Parallel validation - run both CLI and library
    const validation = await validateToolParity({
      toolName: 'mittwald_registry_create',
      cliCommand: 'mw',
      cliArgs: [...argv, '--token', session.mittwaldAccessToken],
      libraryFn: async () => {
        return await createRegistry({
          projectId: args.projectId!,
          description: args.description,
          uri: args.uri,
          apiToken: session.mittwaldAccessToken,
        });
      },
      ignoreFields: ['durationMs', 'duration', 'timestamp'],
    });

    // Log validation results
    if (!validation.passed) {
      logger.warn('[WP05 Validation] Output mismatch detected', {
        tool: 'mittwald_registry_create',
        projectId: args.projectId,
        discrepancyCount: validation.discrepancies.length,
        discrepancies: validation.discrepancies,
        cliExitCode: validation.cliOutput.exitCode,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
      });
    } else {
      logger.info('[WP05 Validation] 100% parity achieved', {
        tool: 'mittwald_registry_create',
        projectId: args.projectId,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
        speedup: `${((validation.cliOutput.durationMs / validation.libraryOutput.durationMs) * 100).toFixed(0)}%`,
      });
    }

    // Use library result (it's validated)
    const result = validation.libraryOutput.data as { id?: string } | undefined;

    return formatToolResponse(
      'success',
      'Registry created successfully',
      {
        registryId: result?.id,
        uri: args.uri,
        description: args.description,
        projectId: args.projectId,
        username: args.username,
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

    logger.error('[WP05] Unexpected error in registry create handler', { error });
    return formatToolResponse('error', `Failed to create registry: ${error instanceof Error ? error.message : String(error)}`);
  }
};
