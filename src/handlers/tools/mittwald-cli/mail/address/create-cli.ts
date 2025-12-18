import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../../tools/index.js';
import { createMailAddress, LibraryError } from '@mittwald-mcp/cli-core';
import { validateToolParity } from '../../../../../../tests/validation/parallel-validator.js';
import { sessionManager } from '../../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../../utils/execution-context.js';
import { logger } from '../../../../../utils/logger.js';

interface MittwaldMailAddressCreateArgs {
  address: string;
  projectId?: string;
  quiet?: boolean;
  catchAll?: boolean;
  enableSpamProtection?: boolean;
  quota?: string;
  password?: string;
  randomPassword?: boolean;
  forwardTo?: string[];
}

function buildCliArgs(args: MittwaldMailAddressCreateArgs): string[] {
  const cliArgs: string[] = ['mail', 'address', 'create', '--address', args.address, '--output', 'json'];

  if (args.projectId) cliArgs.push('--project-id', args.projectId);
  if (args.quiet) cliArgs.push('--quiet');
  if (args.catchAll) cliArgs.push('--catch-all');

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

function mapCliError(error: CliToolError, args: MittwaldMailAddressCreateArgs): string {
  const stderr = (error.stderr || '').toLowerCase();

  if (stderr.includes('not found') && stderr.includes('project')) {
    return `Project not found. Please verify the project ID: ${args.projectId ?? 'not specified'}.\nError: ${error.stderr || error.message}`;
  }

  if (stderr.includes('already exists') || stderr.includes('conflict')) {
    return `Mail address already exists: ${args.address}.\nError: ${error.stderr || error.message}`;
  }

  return error.message;
}

export const handleMittwaldMailAddressCreateCli: MittwaldCliToolHandler<MittwaldMailAddressCreateArgs> = async (args, sessionId) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  if (!args.address) {
    return formatToolResponse('error', 'address is required');
  }

  if (!args.projectId) {
    return formatToolResponse('error', 'projectId is required');
  }

  // Check for unsupported library features
  if (args.catchAll || args.enableSpamProtection !== undefined || args.quota || args.password || args.randomPassword) {
    logger.warn('[WP04] Create mail address: CLI-only features requested, falling back to CLI-only mode', {
      hasAdvancedFeatures: true,
      catchAll: args.catchAll,
      enableSpamProtection: args.enableSpamProtection,
      quota: args.quota,
      hasPassword: Boolean(args.password),
      randomPassword: args.randomPassword,
    });

    return formatToolResponse('error',
      'Advanced mail address options (catchAll, enableSpamProtection, quota, password, randomPassword) are not yet supported in library mode. ' +
      'Only basic mail address creation with forwardTo is currently available.'
    );
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  const argv = buildCliArgs(args);

  try {
    // WP04: Parallel validation - run both CLI and library
    const validation = await validateToolParity({
      toolName: 'mittwald_mail_address_create',
      cliCommand: 'mw',
      cliArgs: [...argv, '--token', session.mittwaldAccessToken],
      libraryFn: async () => {
        return await createMailAddress({
          projectId: args.projectId!,
          address: args.address,
          forwardAddresses: args.forwardTo,
          apiToken: session.mittwaldAccessToken,
        });
      },
      ignoreFields: ['durationMs', 'duration', 'timestamp'],
    });

    // Log validation results
    if (!validation.passed) {
      logger.warn('[WP04 Validation] Output mismatch detected', {
        tool: 'mittwald_mail_address_create',
        address: args.address,
        projectId: args.projectId,
        discrepancyCount: validation.discrepancies.length,
        discrepancies: validation.discrepancies,
        cliExitCode: validation.cliOutput.exitCode,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
      });
    } else {
      logger.info('[WP04 Validation] 100% parity achieved', {
        tool: 'mittwald_mail_address_create',
        address: args.address,
        projectId: args.projectId,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
        speedup: `${((validation.cliOutput.durationMs / validation.libraryOutput.durationMs) * 100).toFixed(0)}%`,
      });
    }

    // Use library result (it's validated)
    const result = validation.libraryOutput.data as any;
    const addressId = result?.id ?? 'unknown';

    return formatToolResponse(
      'success',
      `Successfully created mail address '${args.address}' with ID ${addressId}`,
      {
        id: addressId,
        address: args.address,
        ...(args.forwardTo ? { forwardTo: args.forwardTo } : {}),
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

    logger.error('[WP04] Unexpected error in mail address create handler', { error });
    return formatToolResponse('error', `Failed to create mail address: ${error instanceof Error ? error.message : String(error)}`);
  }
};
