import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../../tools/index.js';
import { createDeliveryBox, LibraryError } from '@mittwald-mcp/cli-core';
import { validateToolParity } from '../../../../../../tests/validation/parallel-validator.js';
import { sessionManager } from '../../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../../utils/execution-context.js';
import { logger } from '../../../../../utils/logger.js';

interface MittwaldMailDeliveryboxCreateArgs {
  projectId?: string;
  description: string;
  quiet?: boolean;
  password?: string;
  randomPassword?: boolean;
}

function buildCliArgs(args: MittwaldMailDeliveryboxCreateArgs): string[] {
  const cliArgs: string[] = ['mail', 'deliverybox', 'create', '--description', args.description, '--output', 'json'];

  if (args.projectId) cliArgs.push('--project-id', args.projectId);
  if (args.quiet) cliArgs.push('--quiet');
  if (args.password) cliArgs.push('--password', args.password);
  if (args.randomPassword) cliArgs.push('--random-password');

  return cliArgs;
}

function mapCliError(error: CliToolError, args: MittwaldMailDeliveryboxCreateArgs): string {
  const stderr = (error.stderr || '').toLowerCase();

  if (stderr.includes('not found') && stderr.includes('project')) {
    return `Project not found. Please verify the project ID: ${args.projectId ?? 'not specified'}.\nError: ${error.stderr || error.message}`;
  }

  return error.message;
}

export const handleMittwaldMailDeliveryboxCreateCli: MittwaldCliToolHandler<MittwaldMailDeliveryboxCreateArgs> = async (args, sessionId) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  if (!args.description) {
    return formatToolResponse('error', 'description is required');
  }

  if (!args.projectId) {
    return formatToolResponse('error', 'projectId is required');
  }

  // Check for unsupported library features
  if (args.randomPassword) {
    logger.warn('[WP04] Create delivery box: randomPassword not supported in library mode', {
      hasRandomPassword: true,
    });

    return formatToolResponse('error',
      'Random password generation is not yet supported in library mode. ' +
      'Please provide an explicit password using the password parameter.'
    );
  }

  if (!args.password) {
    return formatToolResponse('error', 'password is required (randomPassword not supported in library mode)');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  const argv = buildCliArgs(args);

  try {
    // WP04: Parallel validation - run both CLI and library
    const validation = await validateToolParity({
      toolName: 'mittwald_mail_deliverybox_create',
      cliCommand: 'mw',
      cliArgs: [...argv, '--token', session.mittwaldAccessToken],
      libraryFn: async () => {
        return await createDeliveryBox({
          projectId: args.projectId!,
          description: args.description,
          password: args.password!,
          apiToken: session.mittwaldAccessToken,
        });
      },
      ignoreFields: ['durationMs', 'duration', 'timestamp'],
    });

    // Log validation results
    if (!validation.passed) {
      logger.warn('[WP04 Validation] Output mismatch detected', {
        tool: 'mittwald_mail_deliverybox_create',
        description: args.description,
        projectId: args.projectId,
        discrepancyCount: validation.discrepancies.length,
        discrepancies: validation.discrepancies,
        cliExitCode: validation.cliOutput.exitCode,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
      });
    } else {
      logger.info('[WP04 Validation] 100% parity achieved', {
        tool: 'mittwald_mail_deliverybox_create',
        description: args.description,
        projectId: args.projectId,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
        speedup: `${((validation.cliOutput.durationMs / validation.libraryOutput.durationMs) * 100).toFixed(0)}%`,
      });
    }

    // Use library result (it's validated)
    const result = validation.libraryOutput.data as any;
    const deliveryBoxId = result?.id ?? 'unknown';

    return formatToolResponse(
      'success',
      `Successfully created delivery box '${args.description}' with ID ${deliveryBoxId}`,
      {
        id: deliveryBoxId,
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
      const message = mapCliError(error, args);
      return formatToolResponse('error', message, {
        exitCode: error.exitCode,
        stderr: error.stderr,
        stdout: error.stdout,
        suggestedAction: error.suggestedAction,
      });
    }

    logger.error('[WP04] Unexpected error in mail deliverybox create handler', { error });
    return formatToolResponse('error', `Failed to create delivery box: ${error instanceof Error ? error.message : String(error)}`);
  }
};
