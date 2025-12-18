import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../../tools/index.js';
import { createUserSshKey, LibraryError } from '@mittwald-mcp/cli-core';
import { validateToolParity } from '../../../../../../tests/validation/parallel-validator.js';
import { sessionManager } from '../../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../../utils/execution-context.js';
import { logger } from '../../../../../utils/logger.js';

interface MittwaldUserSshKeyCreateArgs {
  publicKey: string;
  quiet?: boolean;
  expires?: string;
  output?: string;
  noPassphrase?: boolean;
  comment?: string;
}

function buildCliArgs(args: MittwaldUserSshKeyCreateArgs): string[] {
  const argv = ['user', 'ssh-key', 'create'];

  if (args.expires) argv.push('--expires', args.expires);
  if (args.output) argv.push('--output', args.output);
  if (args.noPassphrase) argv.push('--no-passphrase');
  if (args.comment) argv.push('--comment', args.comment);
  if (args.quiet) argv.push('--quiet');

  return argv;
}

function mapCliError(error: CliToolError): string {
  const stdout = error.stdout ?? '';
  const stderr = error.stderr ?? '';
  const rawMessage = stderr || stdout || error.message;
  return `Failed to create SSH key: ${rawMessage}`;
}

export const handleUserSshKeyCreateCli: MittwaldCliToolHandler<MittwaldUserSshKeyCreateArgs> = async (args, sessionId) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  if (!args.publicKey) {
    return formatToolResponse('error', 'publicKey is required. Note: The library version requires an existing public key to import, it does not generate keys locally.');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  const argv = buildCliArgs(args);

  try {
    // WP05: Parallel validation - run both CLI and library
    const validation = await validateToolParity({
      toolName: 'mittwald_user_ssh_key_create',
      cliCommand: 'mw',
      cliArgs: [...argv, '--token', session.mittwaldAccessToken],
      libraryFn: async () => {
        return await createUserSshKey({
          publicKey: args.publicKey,
          comment: args.comment,
          expiresAt: args.expires,
          apiToken: session.mittwaldAccessToken,
        });
      },
      ignoreFields: ['durationMs', 'duration', 'timestamp'],
    });

    // Log validation results
    if (!validation.passed) {
      logger.warn('[WP05 Validation] Output mismatch detected', {
        tool: 'mittwald_user_ssh_key_create',
        discrepancyCount: validation.discrepancies.length,
        discrepancies: validation.discrepancies,
        cliExitCode: validation.cliOutput.exitCode,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
      });
    } else {
      logger.info('[WP05 Validation] 100% parity achieved', {
        tool: 'mittwald_user_ssh_key_create',
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
        speedup: `${((validation.cliOutput.durationMs / validation.libraryOutput.durationMs) * 100).toFixed(0)}%`,
      });
    }

    // Use library result (it's validated)
    const sshKey = validation.libraryOutput.data as any;

    return formatToolResponse(
      'success',
      'SSH key imported successfully',
      {
        sshKeyId: sshKey?.id,
        publicKey: args.publicKey,
        comment: args.comment,
        expiresAt: args.expires,
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
      const message = mapCliError(error);
      return formatToolResponse('error', message, {
        exitCode: error.exitCode,
        stderr: error.stderr,
        stdout: error.stdout,
        suggestedAction: error.suggestedAction,
      });
    }

    logger.error('[WP05] Unexpected error in user ssh key create handler', { error });
    return formatToolResponse('error', `Failed to create SSH key: ${error instanceof Error ? error.message : String(error)}`);
  }
};
