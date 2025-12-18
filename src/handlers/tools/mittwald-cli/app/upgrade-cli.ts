import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { upgradeApp, LibraryError } from '@mittwald-mcp/cli-core';
import { validateToolParity } from '../../../../../tests/validation/parallel-validator.js';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';
import { logger } from '../../../../utils/logger.js';

interface MittwaldAppUpgradeArgs {
  installationId?: string;
  targetVersion?: string;
  force?: boolean;
  projectId?: string;
  quiet?: boolean;
  wait?: boolean;
  waitTimeout?: string;
}

function buildCliArgs(args: MittwaldAppUpgradeArgs, installationId: string): string[] {
  const cliArgs: string[] = ['app', 'upgrade', installationId];

  if (args.targetVersion) cliArgs.push('--target-version', args.targetVersion);
  if (args.force) cliArgs.push('--force');
  if (args.projectId) cliArgs.push('--project-id', args.projectId);
  if (args.quiet) cliArgs.push('--quiet');
  if (args.wait) cliArgs.push('--wait');
  if (args.waitTimeout) cliArgs.push('--wait-timeout', args.waitTimeout);

  return cliArgs;
}

export const handleAppUpgradeCli: MittwaldCliToolHandler<MittwaldAppUpgradeArgs> = async (args, sessionId) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  if (!args.installationId) {
    return formatToolResponse('error', 'Installation ID is required. Please provide the installationId parameter.');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  const argv = buildCliArgs(args, args.installationId);

  try {
    const validation = await validateToolParity({
      toolName: 'mittwald_app_upgrade',
      cliCommand: 'mw',
      cliArgs: [...argv, '--token', session.mittwaldAccessToken],
      libraryFn: async () => {
        return await upgradeApp({
          installationId: args.installationId!,
          targetVersion: args.targetVersion,
          apiToken: session.mittwaldAccessToken,
        });
      },
      ignoreFields: ['durationMs', 'duration', 'timestamp'],
    });

    if (!validation.passed) {
      logger.warn('[WP05 Validation] Output mismatch detected', {
        tool: 'mittwald_app_upgrade',
        installationId: args.installationId,
        discrepancyCount: validation.discrepancies.length,
        discrepancies: validation.discrepancies,
      });
    }

    const message = args.wait
      ? `App upgrade completed successfully for installation ${args.installationId}`
      : `App upgrade started for installation ${args.installationId}`;

    return formatToolResponse(
      'success',
      message,
      {
        installationId: args.installationId,
        targetVersion: args.targetVersion,
        projectId: args.projectId,
        force: args.force,
        wait: args.wait,
      },
      {
        durationMs: validation.libraryOutput.durationMs,
        validationPassed: validation.passed,
        discrepancyCount: validation.discrepancies.length,
      }
    );
  } catch (error) {
    if (error instanceof LibraryError) {
      const message = error.message.toLowerCase().includes('not found') && error.message.toLowerCase().includes('installation')
        ? `App installation not found. Please verify the installation ID: ${args.installationId}.`
        : error.message.toLowerCase().includes('not found') && error.message.toLowerCase().includes('version')
        ? `Target version not found. Please verify the target version: ${args.targetVersion ?? 'not specified'}.`
        : error.message.toLowerCase().includes('cancelled') || error.message.toLowerCase().includes('canceled') || error.message.toLowerCase().includes('abort')
        ? `Upgrade operation was cancelled. Use --force flag to skip confirmation.`
        : error.message;

      return formatToolResponse('error', message, {
        code: error.code,
        details: error.details,
      });
    }

    logger.error('[WP05] Unexpected error in app upgrade handler', { error });
    return formatToolResponse('error', `Failed to upgrade app: ${error instanceof Error ? error.message : String(error)}`);
  }
};
