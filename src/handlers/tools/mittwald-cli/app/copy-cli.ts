import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { copyApp, LibraryError } from '@mittwald-mcp/cli-core';
import { validateToolParity } from '../../../../../tests/validation/parallel-validator.js';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';
import { logger } from '../../../../utils/logger.js';

interface MittwaldAppCopyArgs {
  installationId?: string;
  description: string;
  quiet?: boolean;
}

export const handleAppCopyCli: MittwaldCliToolHandler<MittwaldAppCopyArgs> = async (args, sessionId) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  if (!args.installationId) {
    return formatToolResponse(
      'error',
      'Installation ID is required. Please provide the installationId parameter.'
    );
  }

  if (!args.description) {
    return formatToolResponse(
      'error',
      'Description is required. Please provide the description parameter.'
    );
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  const argv: string[] = ['app', 'copy', args.installationId, '--description', args.description];
  if (args.quiet) argv.push('--quiet');

  try {
    const validation = await validateToolParity({
      toolName: 'mittwald_app_copy',
      cliCommand: 'mw',
      cliArgs: [...argv, '--token', session.mittwaldAccessToken],
      libraryFn: async () => {
        return await copyApp({
          installationId: args.installationId!,
          description: args.description,
          apiToken: session.mittwaldAccessToken,
        });
      },
      ignoreFields: ['durationMs', 'duration', 'timestamp'],
    });

    if (!validation.passed) {
      logger.warn('[WP05 Validation] Output mismatch detected', {
        tool: 'mittwald_app_copy',
        installationId: args.installationId,
        discrepancyCount: validation.discrepancies.length,
        discrepancies: validation.discrepancies,
      });
    }

    const copyData = validation.libraryOutput.data as any;

    return formatToolResponse(
      'success',
      'App copied successfully',
      {
        originalInstallationId: args.installationId,
        newInstallationId: copyData?.id,
        description: args.description,
        quiet: args.quiet,
      },
      {
        durationMs: validation.libraryOutput.durationMs,
        validationPassed: validation.passed,
        discrepancyCount: validation.discrepancies.length,
      }
    );
  } catch (error) {
    if (error instanceof LibraryError) {
      const message = error.message.toLowerCase().includes('not found')
        ? `App installation not found. Please verify the installation ID: ${args.installationId}.`
        : error.message;

      return formatToolResponse('error', message, {
        code: error.code,
        details: error.details,
      });
    }

    logger.error('[WP05] Unexpected error in app copy handler', { error });
    return formatToolResponse('error', `Failed to copy app: ${error instanceof Error ? error.message : String(error)}`);
  }
};
