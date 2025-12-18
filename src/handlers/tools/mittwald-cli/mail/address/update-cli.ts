import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../../tools/index.js';
import { updateMailAddressCatchAll, LibraryError } from '@mittwald-mcp/cli-core';
import { validateToolParity } from '../../../../../../tests/validation/parallel-validator.js';
import { sessionManager } from '../../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../../utils/execution-context.js';
import { logger } from '../../../../../utils/logger.js';

interface MittwaldMailAddressUpdateArgs {
  id: string;
  quiet?: boolean;
  catchAll?: boolean;
  enableSpamProtection?: boolean;
  quota?: string;
  password?: string;
  randomPassword?: boolean;
  forwardTo?: string[];
}

function buildCliArgs(args: MittwaldMailAddressUpdateArgs): string[] {
  const cliArgs: string[] = ['mail', 'address', 'update', args.id];

  if (args.quiet) cliArgs.push('--quiet');
  if (args.catchAll !== undefined) cliArgs.push(args.catchAll ? '--catch-all' : '--no-catch-all');
  if (args.enableSpamProtection !== undefined) {
    cliArgs.push(args.enableSpamProtection ? '--enable-spam-protection' : '--no-enable-spam-protection');
  }
  if (args.quota) cliArgs.push('--quota', args.quota);
  if (args.password) cliArgs.push('--password', args.password);
  if (args.randomPassword) cliArgs.push('--random-password');
  if (args.forwardTo) {
    for (const forwardAddress of args.forwardTo) {
      cliArgs.push('--forward-to', forwardAddress);
    }
  }

  return cliArgs;
}

function mapCliError(error: CliToolError, args: MittwaldMailAddressUpdateArgs): string {
  const stderr = (error.stderr || '').toLowerCase();

  if (stderr.includes('not found') || stderr.includes('404')) {
    return `Mail address not found: ${args.id}.\nError: ${error.stderr || error.message}`;
  }

  return error.message;
}

export const handleMittwaldMailAddressUpdateCli: MittwaldCliToolHandler<MittwaldMailAddressUpdateArgs> = async (args, sessionId) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  if (!args.id) {
    return formatToolResponse('error', 'id is required');
  }

  // Check for unsupported library features
  if (args.enableSpamProtection !== undefined || args.quota || args.password || args.randomPassword || args.forwardTo) {
    logger.warn('[WP04] Update mail address: CLI-only features requested, falling back to CLI-only mode', {
      hasAdvancedFeatures: true,
      enableSpamProtection: args.enableSpamProtection,
      quota: args.quota,
      hasPassword: Boolean(args.password),
      randomPassword: args.randomPassword,
      hasForwardTo: Boolean(args.forwardTo),
    });

    return formatToolResponse('error',
      'Advanced mail address update options (enableSpamProtection, quota, password, randomPassword, forwardTo) are not yet supported in library mode. ' +
      'Only catchAll updates are currently available.'
    );
  }

  if (args.catchAll === undefined) {
    return formatToolResponse('error', 'catchAll must be specified (true or false) to update mail address');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  const argv = buildCliArgs(args);

  try {
    // WP04: Parallel validation - run both CLI and library
    const validation = await validateToolParity({
      toolName: 'mittwald_mail_address_update',
      cliCommand: 'mw',
      cliArgs: [...argv, '--token', session.mittwaldAccessToken],
      libraryFn: async () => {
        return await updateMailAddressCatchAll({
          mailAddressId: args.id,
          active: args.catchAll!,
          apiToken: session.mittwaldAccessToken,
        });
      },
      ignoreFields: ['durationMs', 'duration', 'timestamp'],
    });

    // Log validation results
    if (!validation.passed) {
      logger.warn('[WP04 Validation] Output mismatch detected', {
        tool: 'mittwald_mail_address_update',
        mailAddressId: args.id,
        catchAll: args.catchAll,
        discrepancyCount: validation.discrepancies.length,
        discrepancies: validation.discrepancies,
        cliExitCode: validation.cliOutput.exitCode,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
      });
    } else {
      logger.info('[WP04 Validation] 100% parity achieved', {
        tool: 'mittwald_mail_address_update',
        mailAddressId: args.id,
        catchAll: args.catchAll,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
        speedup: `${((validation.cliOutput.durationMs / validation.libraryOutput.durationMs) * 100).toFixed(0)}%`,
      });
    }

    return formatToolResponse(
      'success',
      `Successfully updated mail address: ${args.id}`,
      {
        id: args.id,
        updated: true,
        catchAll: args.catchAll,
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

    logger.error('[WP04] Unexpected error in mail address update handler', { error });
    return formatToolResponse('error', `Failed to update mail address: ${error instanceof Error ? error.message : String(error)}`);
  }
};
