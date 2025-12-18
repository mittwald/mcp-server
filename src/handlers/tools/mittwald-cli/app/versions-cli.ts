import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { getAppVersions, LibraryError } from '@mittwald-mcp/cli-core';
import { validateToolParity } from '../../../../../tests/validation/parallel-validator.js';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';
import { logger } from '../../../../utils/logger.js';

interface MittwaldAppVersionsArgs {
  app?: string;
}

function buildCliArgs(args: MittwaldAppVersionsArgs): string[] {
  const cliArgs: string[] = ['app', 'versions'];
  if (args.app) cliArgs.push(args.app);
  return cliArgs;
}

export const handleAppVersionsCli: MittwaldCliToolHandler<MittwaldAppVersionsArgs> = async (args, sessionId) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  if (!args.app) {
    return formatToolResponse('error', 'App ID is required. Please provide the app parameter.');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  const argv = buildCliArgs(args);

  try {
    const validation = await validateToolParity({
      toolName: 'mittwald_app_versions',
      cliCommand: 'mw',
      cliArgs: [...argv, '--token', session.mittwaldAccessToken],
      libraryFn: async () => {
        return await getAppVersions({
          appId: args.app!,
          apiToken: session.mittwaldAccessToken,
        });
      },
      ignoreFields: ['durationMs', 'duration', 'timestamp'],
    });

    if (!validation.passed) {
      logger.warn('[WP05 Validation] Output mismatch detected', {
        tool: 'mittwald_app_versions',
        app: args.app,
        discrepancyCount: validation.discrepancies.length,
        discrepancies: validation.discrepancies,
      });
    }

    const versions = validation.libraryOutput.data as any[];

    return formatToolResponse(
      'success',
      `Found ${versions.length} version(s) for ${args.app}`,
      versions,
      {
        durationMs: validation.libraryOutput.durationMs,
        validationPassed: validation.passed,
        discrepancyCount: validation.discrepancies.length,
      }
    );
  } catch (error) {
    if (error instanceof LibraryError) {
      const message = error.message.toLowerCase().includes('not found')
        ? `App not found. Please verify the app name: ${args.app ?? 'not specified'}.`
        : error.message;

      return formatToolResponse('error', message, {
        code: error.code,
        details: error.details,
      });
    }

    logger.error('[WP05] Unexpected error in app versions handler', { error });
    return formatToolResponse('error', `Failed to get app versions: ${error instanceof Error ? error.message : String(error)}`);
  }
};
