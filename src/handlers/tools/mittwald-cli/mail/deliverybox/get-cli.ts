import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../../tools/index.js';
import { getDeliveryBox, LibraryError } from '@mittwald-mcp/cli-core';
import { validateToolParity } from '../../../../../../tests/validation/parallel-validator.js';
import { sessionManager } from '../../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../../utils/execution-context.js';
import { logger } from '../../../../../utils/logger.js';

interface MittwaldMailDeliveryboxGetArgs {
  id: string;
  output?: 'txt' | 'json' | 'yaml';
}

function buildCliArgs(args: MittwaldMailDeliveryboxGetArgs): string[] {
  // We always request JSON to simplify parsing
  const argv: string[] = ['mail', 'deliverybox', 'get', args.id, '--output', 'json'];
  return argv;
}

function mapCliError(error: CliToolError, id: string): string {
  const stderr = (error.stderr || '').toLowerCase();

  if (stderr.includes('not found') || stderr.includes('404')) {
    return `Delivery box not found: ${id}.\nError: ${error.stderr || error.message}`;
  }

  return error.message;
}

export const handleMittwaldMailDeliveryboxGetCli: MittwaldCliToolHandler<MittwaldMailDeliveryboxGetArgs> = async (args, sessionId) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  if (!args.id) {
    return formatToolResponse('error', 'id is required');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  const argv = buildCliArgs(args);

  try {
    // WP04: Parallel validation - run both CLI and library
    const validation = await validateToolParity({
      toolName: 'mittwald_mail_deliverybox_get',
      cliCommand: 'mw',
      cliArgs: [...argv, '--token', session.mittwaldAccessToken],
      libraryFn: async () => {
        return await getDeliveryBox({
          deliveryBoxId: args.id,
          apiToken: session.mittwaldAccessToken,
        });
      },
      ignoreFields: ['durationMs', 'duration', 'timestamp'],
    });

    // Log validation results
    if (!validation.passed) {
      logger.warn('[WP04 Validation] Output mismatch detected', {
        tool: 'mittwald_mail_deliverybox_get',
        deliveryBoxId: args.id,
        discrepancyCount: validation.discrepancies.length,
        discrepancies: validation.discrepancies,
        cliExitCode: validation.cliOutput.exitCode,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
      });
    } else {
      logger.info('[WP04 Validation] 100% parity achieved', {
        tool: 'mittwald_mail_deliverybox_get',
        deliveryBoxId: args.id,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
        speedup: `${((validation.cliOutput.durationMs / validation.libraryOutput.durationMs) * 100).toFixed(0)}%`,
      });
    }

    // Use library result (it's validated)
    const deliveryBox = validation.libraryOutput.data as any;
    const label = deliveryBox?.description ?? args.id;

    return formatToolResponse(
      'success',
      `Retrieved delivery box: ${label}`,
      deliveryBox,
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

    logger.error('[WP04] Unexpected error in mail deliverybox get handler', { error });
    return formatToolResponse('error', `Failed to get delivery box: ${error instanceof Error ? error.message : String(error)}`);
  }
};
