import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../../tools/index.js';
import { deleteDeliveryBox, LibraryError } from '@mittwald-mcp/cli-core';
import { validateToolParity } from '../../../../../../tests/validation/parallel-validator.js';
import { sessionManager } from '../../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../../utils/execution-context.js';
import { logger } from '../../../../../utils/logger.js';

interface MittwaldMailDeliveryboxDeleteArgs {
  id: string;
  confirm?: boolean;
  quiet?: boolean;
  force?: boolean;
}

function buildCliArgs(args: MittwaldMailDeliveryboxDeleteArgs): string[] {
  const cliArgs: string[] = ['mail', 'deliverybox', 'delete', args.id];
  if (args.quiet) cliArgs.push('--quiet');
  if (args.force) cliArgs.push('--force');
  return cliArgs;
}

function mapCliError(error: CliToolError, args: MittwaldMailDeliveryboxDeleteArgs): string {
  const stderr = (error.stderr || '').toLowerCase();

  if (stderr.includes('not found') || stderr.includes('404')) {
    return `Delivery box not found: ${args.id}.\nError: ${error.stderr || error.message}`;
  }

  return error.message;
}

export const handleMittwaldMailDeliveryboxDeleteCli: MittwaldCliToolHandler<MittwaldMailDeliveryboxDeleteArgs> = async (args, sessionId) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  if (!args.id) {
    return formatToolResponse('error', 'id is required');
  }

  if (args.confirm !== true) {
    return formatToolResponse(
      'error',
      'Delivery box deletion requires confirm=true. This operation is destructive and cannot be undone.'
    );
  }

  logger.warn('[MailDeliveryboxDelete] Destructive operation attempted', {
    deliveryboxId: args.id,
    force: Boolean(args.force),
    sessionId: effectiveSessionId,
  });

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  const argv = buildCliArgs(args);

  try {
    // WP04: Parallel validation - run both CLI and library
    const validation = await validateToolParity({
      toolName: 'mittwald_mail_deliverybox_delete',
      cliCommand: 'mw',
      cliArgs: [...argv, '--token', session.mittwaldAccessToken],
      libraryFn: async () => {
        return await deleteDeliveryBox({
          deliveryBoxId: args.id,
          apiToken: session.mittwaldAccessToken,
        });
      },
      ignoreFields: ['durationMs', 'duration', 'timestamp'],
    });

    // Log validation results
    if (!validation.passed) {
      logger.warn('[WP04 Validation] Output mismatch detected', {
        tool: 'mittwald_mail_deliverybox_delete',
        deliveryBoxId: args.id,
        discrepancyCount: validation.discrepancies.length,
        discrepancies: validation.discrepancies,
        cliExitCode: validation.cliOutput.exitCode,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
      });
    } else {
      logger.info('[WP04 Validation] 100% parity achieved', {
        tool: 'mittwald_mail_deliverybox_delete',
        deliveryBoxId: args.id,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
        speedup: `${((validation.cliOutput.durationMs / validation.libraryOutput.durationMs) * 100).toFixed(0)}%`,
      });
    }

    return formatToolResponse(
      'success',
      `Successfully deleted delivery box: ${args.id}`,
      {
        id: args.id,
        deleted: true,
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

    logger.error('[WP04] Unexpected error in mail deliverybox delete handler', { error });
    return formatToolResponse('error', `Failed to delete delivery box: ${error instanceof Error ? error.message : String(error)}`);
  }
};
