import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { CliToolError } from '@/tools/index.js';
import { updateMysqlUser, LibraryError } from '@mittwald-mcp/cli-core';
import { validateToolParity } from '../../../../../../tests/validation/parallel-validator.js';
import { sessionManager } from '../../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../../utils/execution-context.js';
import { logger } from '../../../../../utils/logger.js';
import { buildSecureToolResponse, buildUpdatedAttributes } from '../../../../../utils/credential-response.js';

interface MittwaldDatabaseMysqlUserUpdateArgs {
  userId: string;
  description?: string;
  accessLevel?: 'readonly' | 'full';
  password?: string;
  accessIpMask?: string;
  enableExternalAccess?: boolean;
  disableExternalAccess?: boolean;
  quiet?: boolean;
}

function buildCliArgs(args: MittwaldDatabaseMysqlUserUpdateArgs): string[] {
  const cliArgs: string[] = ['database', 'mysql', 'user', 'update', args.userId];

  if (args.accessLevel) cliArgs.push('--access-level', args.accessLevel);
  if (args.description) cliArgs.push('--description', args.description);
  if (args.password) cliArgs.push('--password', args.password);
  if (args.accessIpMask) cliArgs.push('--access-ip-mask', args.accessIpMask);
  if (args.enableExternalAccess) cliArgs.push('--enable-external-access');
  if (args.disableExternalAccess) cliArgs.push('--disable-external-access');
  if (args.quiet ?? true) cliArgs.push('--quiet');

  return cliArgs;
}

function mapCliError(error: CliToolError, args: MittwaldDatabaseMysqlUserUpdateArgs): string {
  const combined = `${error.stderr ?? ''}\n${error.stdout ?? ''}`.toLowerCase();
  const message = error.stderr || error.stdout || error.message;

  if (combined.includes('permission denied') || combined.includes('forbidden') || combined.includes('401')) {
    return `Permission denied while updating MySQL user. Re-authenticate and ensure the Mittwald CLI session is valid.\nError: ${message}`;
  }

  if (combined.includes('not found') || combined.includes('404')) {
    return `MySQL user not found. Verify the user ID: ${args.userId}.\nError: ${message}`;
  }

  if (combined.includes('access-ip-mask') && combined.includes('external access')) {
    return `Access IP mask changes require external access to be enabled. Enable external access or omit the access IP mask.\nError: ${message}`;
  }

  return `Failed to update MySQL user: ${message}`;
}

function hasUpdatePayload(args: MittwaldDatabaseMysqlUserUpdateArgs): boolean {
  return Boolean(
    args.description ||
      args.accessLevel ||
      args.password ||
      typeof args.enableExternalAccess === 'boolean' ||
      typeof args.disableExternalAccess === 'boolean' ||
      args.accessIpMask
  );
}

export const handleDatabaseMysqlUserUpdateCli: MittwaldCliToolHandler<MittwaldDatabaseMysqlUserUpdateArgs> = async (
  args,
  sessionId,
) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return buildSecureToolResponse('error', 'Session ID required');
  }

  if (!args.userId) {
    return buildSecureToolResponse('error', 'User ID is required to update a MySQL user.');
  }

  if (args.enableExternalAccess && args.disableExternalAccess) {
    return buildSecureToolResponse('error', 'enableExternalAccess and disableExternalAccess cannot both be true.');
  }

  if (!hasUpdatePayload(args)) {
    return buildSecureToolResponse(
      'error',
      'Provide at least one property to update (description, accessLevel, password, accessIpMask, or external access flags).'
    );
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return buildSecureToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  const argv = buildCliArgs(args);

  try {
    // WP04: Parallel validation - run both CLI and library
    const validation = await validateToolParity({
      toolName: 'mittwald_database_mysql_user_update',
      cliCommand: 'mw',
      cliArgs: [...argv, '--token', session.mittwaldAccessToken],
      libraryFn: async () => {
        return await updateMysqlUser({
          userId: args.userId,
          description: args.description,
          password: args.password,
          apiToken: session.mittwaldAccessToken,
        });
      },
      ignoreFields: ['durationMs', 'duration', 'timestamp'],
    });

    // Log validation results
    if (!validation.passed) {
      logger.warn('[WP04 Validation] Output mismatch detected', {
        tool: 'mittwald_database_mysql_user_update',
        userId: args.userId,
        discrepancyCount: validation.discrepancies.length,
        discrepancies: validation.discrepancies,
        cliExitCode: validation.cliOutput.exitCode,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
      });
    } else {
      logger.info('[WP04 Validation] 100% parity achieved', {
        tool: 'mittwald_database_mysql_user_update',
        userId: args.userId,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
        speedup: `${((validation.cliOutput.durationMs / validation.libraryOutput.durationMs) * 100).toFixed(0)}%`,
      });
    }

    const updatedAttributes = buildUpdatedAttributes({
      description: args.description,
      accessLevel: args.accessLevel,
      accessIpMask: args.accessIpMask,
      externalAccess:
        args.enableExternalAccess === true
          ? 'enabled'
          : args.disableExternalAccess === true
            ? 'disabled'
            : undefined,
      password: typeof args.password === 'string' ? 'updated' : undefined,
    });

    return buildSecureToolResponse(
      'success',
      `Updated MySQL user ${args.userId}.`,
      {
        userId: args.userId,
        updatedAttributes,
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
      return buildSecureToolResponse('error', error.message, {
        code: error.code,
        details: error.details,
      });
    }

    if (error instanceof CliToolError) {
      const message = mapCliError(error, args);
      return buildSecureToolResponse('error', message, {
        exitCode: error.exitCode,
        stderr: error.stderr,
        stdout: error.stdout,
        suggestedAction: error.suggestedAction,
      });
    }

    logger.error('[WP04] Unexpected error in database mysql user update handler', { error });
    return buildSecureToolResponse('error', `Failed to update MySQL user: ${error instanceof Error ? error.message : String(error)}`);
  }
};
