import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { parseQuietOutput } from '../../../../utils/cli-output.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';
import { updateSftpUser, LibraryError } from '@mittwald-mcp/cli-core';
import { validateToolParity } from '../../../../../tests/validation/parallel-validator.js';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';
import { logger } from '../../../../utils/logger.js';

interface MittwaldSftpUserUpdateArgs {
  sftpUserId: string;
  quiet?: boolean;
  expires?: string;
  description?: string;
  publicKey?: string;
  password?: string;
  accessLevel?: 'read' | 'full';
  directories?: string[];
  enable?: boolean;
  disable?: boolean;
}

function buildCliArgs(args: MittwaldSftpUserUpdateArgs): string[] {
  const cliArgs: string[] = ['sftp-user', 'update', args.sftpUserId];

  if (args.quiet) cliArgs.push('--quiet');
  if (args.expires) cliArgs.push('--expires', args.expires);
  if (args.description) cliArgs.push('--description', args.description);
  if (args.publicKey) cliArgs.push('--public-key', args.publicKey);
  if (args.password) cliArgs.push('--password', args.password);
  if (args.accessLevel) cliArgs.push('--access-level', args.accessLevel);
  if (args.directories) {
    for (const directory of args.directories) {
      cliArgs.push('--directories', directory);
    }
  }
  if (args.enable) cliArgs.push('--enable');
  if (args.disable) cliArgs.push('--disable');

  return cliArgs;
}

function mapCliError(error: CliToolError, args: MittwaldSftpUserUpdateArgs): string {
  const combined = `${error.stderr ?? ''}\n${error.stdout ?? ''}`.toLowerCase();
  const errorText = error.stderr || error.stdout || error.message;

  if (
    combined.includes('403') ||
    combined.includes('forbidden') ||
    combined.includes('permission denied')
  ) {
    return `Permission denied when updating SFTP user. Complete OAuth sign-in and ensure the Mittwald CLI is authenticated.\nError: ${errorText}`;
  }

  if (combined.includes('not found') && combined.includes('sftp user')) {
    return `SFTP user not found. Please verify the SFTP user ID: ${args.sftpUserId}.\nError: ${errorText}`;
  }

  if (combined.includes('invalid') && combined.includes('format')) {
    return `Invalid format in request. Please check your parameters.\nError: ${errorText}`;
  }

  return `Failed to update SFTP user: ${errorText}`;
}

export const handleSftpUserUpdateCli: MittwaldCliToolHandler<MittwaldSftpUserUpdateArgs> = async (args, sessionId) => {
  if (!args.sftpUserId) {
    return formatToolResponse('error', 'SFTP user ID is required to update an SFTP user');
  }

  if (args.enable && args.disable) {
    return formatToolResponse('error', 'Cannot specify both --enable and --disable flags');
  }

  if (args.publicKey && args.password) {
    return formatToolResponse('error', 'Cannot specify both --public-key and --password (they are mutually exclusive)');
  }

  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  const argv = buildCliArgs(args);

  try {
    // WP05: Note - Library function has limited parameter support (only password updates)
    // CLI supports: expires, publicKey, accessLevel, directories, enable/disable, description
    // We only validate when doing simple password updates
    const canUseLibrary = args.password && !args.publicKey && !args.expires && !args.accessLevel &&
                          !args.directories && !args.enable && !args.disable && !args.description;

    if (canUseLibrary) {
      // Run parallel validation for simple password updates
      const validation = await validateToolParity({
        toolName: 'mittwald_sftp_user_update',
        cliCommand: 'mw',
        cliArgs: [...argv, '--token', session.mittwaldAccessToken],
        libraryFn: async () => {
          return await updateSftpUser({
            sftpUserId: args.sftpUserId,
            password: args.password,
            apiToken: session.mittwaldAccessToken,
          });
        },
        ignoreFields: ['durationMs', 'duration', 'timestamp'],
      });

      // Log validation results
      if (!validation.passed) {
        logger.warn('[WP05 Validation] Output mismatch detected', {
          tool: 'mittwald_sftp_user_update',
          sftpUserId: args.sftpUserId,
          discrepancyCount: validation.discrepancies.length,
          discrepancies: validation.discrepancies,
          cliExitCode: validation.cliOutput.exitCode,
          cliDuration: validation.cliOutput.durationMs,
          libraryDuration: validation.libraryOutput.durationMs,
        });
      } else {
        logger.info('[WP05 Validation] 100% parity achieved', {
          tool: 'mittwald_sftp_user_update',
          sftpUserId: args.sftpUserId,
          cliDuration: validation.cliOutput.durationMs,
          libraryDuration: validation.libraryOutput.durationMs,
          speedup: `${((validation.cliOutput.durationMs / validation.libraryOutput.durationMs) * 100).toFixed(0)}%`,
        });
      }

      if (args.quiet) {
        const quietOutput = parseQuietOutput('') || args.sftpUserId;
        return formatToolResponse(
          'success',
          quietOutput,
          {
            sftpUserId: args.sftpUserId,
            action: 'updated',
          },
          {
            durationMs: validation.libraryOutput.durationMs,
            validationPassed: validation.passed,
            cliDuration: validation.cliOutput.durationMs,
            libraryDuration: validation.libraryOutput.durationMs,
          }
        );
      }

      const updatedFields = ['password'];

      return formatToolResponse(
        'success',
        `SFTP user ${args.sftpUserId} updated successfully`,
        {
          sftpUserId: args.sftpUserId,
          action: 'updated',
          updatedFields,
        },
        {
          durationMs: validation.libraryOutput.durationMs,
          validationPassed: validation.passed,
          discrepancyCount: validation.discrepancies.length,
          cliDuration: validation.cliOutput.durationMs,
          libraryDuration: validation.libraryOutput.durationMs,
        }
      );
    } else {
      // Fall back to CLI-only for advanced features
      logger.info('[WP05] Using CLI-only mode for advanced SFTP user update features', {
        tool: 'mittwald_sftp_user_update',
        sftpUserId: args.sftpUserId,
        hasPublicKey: Boolean(args.publicKey),
        hasExpires: Boolean(args.expires),
        hasAccessLevel: Boolean(args.accessLevel),
        hasDirectories: Boolean(args.directories),
        hasDescription: Boolean(args.description),
        hasEnable: Boolean(args.enable),
        hasDisable: Boolean(args.disable),
        reason: 'Library function only supports password updates',
      });

      const result = await invokeCliTool({
        toolName: 'mittwald_sftp_user_update',
        argv,
        parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
      });

      const stdout = result.result.stdout ?? '';
      const stderr = result.result.stderr ?? '';

      if (args.quiet) {
        const quietOutput = parseQuietOutput(stdout ?? '') || args.sftpUserId;
        return formatToolResponse(
          'success',
          quietOutput,
          {
            sftpUserId: args.sftpUserId,
            action: 'updated',
            output: stdout || stderr,
          },
          {
            command: result.meta.command,
            durationMs: result.meta.durationMs,
            mode: 'cli-only',
          }
        );
      }

      const updatedFields: string[] = [];
      if (args.description) updatedFields.push('description');
      if (args.expires) updatedFields.push('expires');
      if (args.publicKey) updatedFields.push('public key');
      if (args.password) updatedFields.push('password');
      if (args.accessLevel) updatedFields.push('access level');
      if (args.directories?.length) updatedFields.push('directories');
      if (args.enable) updatedFields.push('enabled');
      if (args.disable) updatedFields.push('disabled');

      return formatToolResponse(
        'success',
        `SFTP user ${args.sftpUserId} updated successfully`,
        {
          sftpUserId: args.sftpUserId,
          action: 'updated',
          updatedFields,
          output: stdout || stderr,
        },
        {
          command: result.meta.command,
          durationMs: result.meta.durationMs,
          mode: 'cli-only',
        }
      );
    }
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

    logger.error('[WP05] Unexpected error in sftp user update handler', { error });
    return formatToolResponse(
      'error',
      `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
