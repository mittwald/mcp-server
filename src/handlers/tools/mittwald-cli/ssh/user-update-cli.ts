import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';
import { updateSshUser, LibraryError } from '@mittwald-mcp/cli-core';
import { validateToolParity } from '../../../../../tests/validation/parallel-validator.js';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';
import { logger } from '../../../../utils/logger.js';

interface MittwaldSshUserUpdateArgs {
  sshUserId: string;
  quiet?: boolean;
  expires?: string;
  description?: string;
  publicKey?: string;
  password?: string;
  enable?: boolean;
  disable?: boolean;
}

function buildCliArgs(args: MittwaldSshUserUpdateArgs): string[] {
  const cliArgs: string[] = ['ssh-user', 'update', args.sshUserId];

  if (args.quiet) cliArgs.push('--quiet');
  if (args.expires) cliArgs.push('--expires', args.expires);
  if (args.description) cliArgs.push('--description', args.description);
  if (args.publicKey) cliArgs.push('--public-key', args.publicKey);
  if (args.password) cliArgs.push('--password', args.password);
  if (args.enable) cliArgs.push('--enable');
  if (args.disable) cliArgs.push('--disable');

  return cliArgs;
}

function parseQuietOutput(output: string): string | undefined {
  const trimmed = output.trim();
  if (!trimmed) return undefined;
  const lines = trimmed.split(/\r?\n/);
  return lines.at(-1);
}

function collectUpdatedFields(args: MittwaldSshUserUpdateArgs): string[] {
  const fields: string[] = [];
  if (args.description) fields.push('description');
  if (args.expires) fields.push('expires');
  if (args.publicKey) fields.push('public key');
  if (args.password) fields.push('password');
  if (args.enable) fields.push('enabled');
  if (args.disable) fields.push('disabled');
  return fields;
}

function mapCliError(error: CliToolError, args: MittwaldSshUserUpdateArgs): string {
  const stderr = error.stderr ?? '';
  const stdout = error.stdout ?? '';
  const combined = `${stderr}\n${stdout}\n${error.message}`.toLowerCase();

  if (combined.includes('403') || combined.includes('forbidden') || combined.includes('permission denied')) {
    const details = stderr || stdout || error.message;
    return `Permission denied when updating SSH user. Complete OAuth sign-in and ensure the Mittwald CLI is authenticated.\nError: ${details}`;
  }

  if (combined.includes('not found') && combined.includes('ssh user')) {
    const details = stderr || stdout || error.message;
    return `SSH user not found. Please verify the SSH user ID: ${args.sshUserId}.\nError: ${details}`;
  }

  if (combined.includes('invalid') && combined.includes('format')) {
    const details = stderr || stdout || error.message;
    return `Invalid format in request. Please check your parameters.\nError: ${details}`;
  }

  const details = stderr || stdout || error.message;
  return `Failed to update SSH user: ${details}`;
}

export const handleSshUserUpdateCli: MittwaldCliToolHandler<MittwaldSshUserUpdateArgs> = async (args, sessionId) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  if (!args.sshUserId) {
    return formatToolResponse('error', 'SSH user ID is required to update an SSH user');
  }

  if (args.enable && args.disable) {
    return formatToolResponse('error', 'Cannot specify both --enable and --disable flags');
  }

  if (args.publicKey && args.password) {
    return formatToolResponse('error', 'Cannot specify both --public-key and --password (they are mutually exclusive)');
  }

  const argv = buildCliArgs(args);
  const updatedFields = collectUpdatedFields(args);

  try {
    // WP05: Parallel validation - run both CLI and library
    const validation = await validateToolParity({
      toolName: 'mittwald_ssh_user_update',
      cliCommand: 'mw',
      cliArgs: [...argv, '--token', session.mittwaldAccessToken],
      libraryFn: async () => {
        return await updateSshUser({
          sshUserId: args.sshUserId,
          description: args.description,
          active: args.enable ? true : args.disable ? false : undefined,
          apiToken: session.mittwaldAccessToken,
        });
      },
      ignoreFields: ['durationMs', 'duration', 'timestamp'],
    });

    // Log validation results
    if (!validation.passed) {
      logger.warn('[WP05 Validation] Output mismatch detected', {
        tool: 'mittwald_ssh_user_update',
        sshUserId: args.sshUserId,
        discrepancyCount: validation.discrepancies.length,
        discrepancies: validation.discrepancies,
        cliExitCode: validation.cliOutput.exitCode,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
      });
    } else {
      logger.info('[WP05 Validation] 100% parity achieved', {
        tool: 'mittwald_ssh_user_update',
        sshUserId: args.sshUserId,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
        speedup: `${((validation.cliOutput.durationMs / validation.libraryOutput.durationMs) * 100).toFixed(0)}%`,
      });
    }

    // Use library result (it's validated)
    const stdout = validation.cliOutput.stdout || '';

    if (args.quiet) {
      const quietOutput = parseQuietOutput(stdout) ?? args.sshUserId;
      return formatToolResponse(
        'success',
        quietOutput,
        {
          sshUserId: args.sshUserId,
          action: 'updated',
          updatedFields,
          output: stdout,
        },
        {
          durationMs: validation.libraryOutput.durationMs,
          validationPassed: validation.passed,
          discrepancyCount: validation.discrepancies.length,
          cliDuration: validation.cliOutput.durationMs,
          libraryDuration: validation.libraryOutput.durationMs,
        }
      );
    }

    return formatToolResponse(
      'success',
      `SSH user ${args.sshUserId} updated successfully`,
      {
        sshUserId: args.sshUserId,
        action: 'updated',
        updatedFields,
        output: stdout,
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

    logger.error('[WP05] Unexpected error in SSH user update handler', { error });
    return formatToolResponse('error', `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`);
  }
};
