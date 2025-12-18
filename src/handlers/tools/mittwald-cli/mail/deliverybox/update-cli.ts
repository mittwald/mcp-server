import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../../tools/index.js';
import { updateDeliveryBox, LibraryError } from '@mittwald-mcp/cli-core';
import { validateToolParity } from '../../../../../../tests/validation/parallel-validator.js';
import { sessionManager } from '../../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../../utils/execution-context.js';
import { logger } from '../../../../../utils/logger.js';

interface MittwaldMailDeliveryboxUpdateArgs {
  id: string;
  description?: string;
  quiet?: boolean;
  password?: string;
  randomPassword?: boolean;
}

function buildCliArgs(args: MittwaldMailDeliveryboxUpdateArgs): string[] {
  const cliArgs: string[] = ['mail', 'deliverybox', 'update', args.id];
  if (args.quiet) cliArgs.push('--quiet');
  if (args.description) cliArgs.push('--description', args.description);
  if (args.password) cliArgs.push('--password', args.password);
  if (args.randomPassword) cliArgs.push('--random-password');
  return cliArgs;
}

function mapCliError(error: CliToolError, id: string): string {
  const stderr = (error.stderr || '').toLowerCase();

  if (stderr.includes('not found') || stderr.includes('404')) {
    return `Delivery box not found: ${id}.\nError: ${error.stderr || error.message}`;
  }

  return error.message;
}

export const handleMittwaldMailDeliveryboxUpdateCli: MittwaldCliToolHandler<MittwaldMailDeliveryboxUpdateArgs> = async (args, sessionId) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  if (!args.id) {
    return formatToolResponse('error', 'id is required');
  }

  // Check for unsupported library features
  if (args.password || args.randomPassword) {
    logger.warn('[WP04] Update delivery box: password updates not supported in library mode', {
      hasPassword: Boolean(args.password),
      hasRandomPassword: Boolean(args.randomPassword),
    });

    return formatToolResponse('error',
      'Password updates (password, randomPassword) are not yet supported in library mode. ' +
      'Only description updates are currently available.'
    );
  }

  if (!args.description) {
    return formatToolResponse('error', 'description must be specified to update delivery box');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  const argv = buildCliArgs(args);

  try {
    // WP04: Parallel validation - run both CLI and library
    const validation = await validateToolParity({
      toolName: 'mittwald_mail_deliverybox_update',
      cliCommand: 'mw',
      cliArgs: [...argv, '--token', session.mittwaldAccessToken],
      libraryFn: async () => {
        return await updateDeliveryBox({
          deliveryBoxId: args.id,
          description: args.description,
          apiToken: session.mittwaldAccessToken,
        });
      },
      ignoreFields: ['durationMs', 'duration', 'timestamp'],
    });

    // Log validation results
    if (!validation.passed) {
      logger.warn('[WP04 Validation] Output mismatch detected', {
        tool: 'mittwald_mail_deliverybox_update',
        deliveryBoxId: args.id,
        description: args.description,
        discrepancyCount: validation.discrepancies.length,
        discrepancies: validation.discrepancies,
        cliExitCode: validation.cliOutput.exitCode,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
      });
    } else {
      logger.info('[WP04 Validation] 100% parity achieved', {
        tool: 'mittwald_mail_deliverybox_update',
        deliveryBoxId: args.id,
        description: args.description,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
        speedup: `${((validation.cliOutput.durationMs / validation.libraryOutput.durationMs) * 100).toFixed(0)}%`,
      });
    }

    return formatToolResponse(
      'success',
      `Successfully updated delivery box: ${args.id}`,
      {
        id: args.id,
        updated: true,
        description: args.description,
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
      const message = mapCliError(error, args.id);
      return formatToolResponse('error', message, {
        exitCode: error.exitCode,
        stderr: error.stderr,
        stdout: error.stdout,
        suggestedAction: error.suggestedAction,
      });
    }

    logger.error('[WP04] Unexpected error in mail deliverybox update handler', { error });
    return formatToolResponse('error', `Failed to update delivery box: ${error instanceof Error ? error.message : String(error)}`);
  }
};
