import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { logger } from '../../../../../utils/logger.js';
import { invokeCliTool, CliToolError } from '../../../../../tools/index.js';
import { revokeUserApiToken, LibraryError } from '@mittwald-mcp/cli-core';
import { validateToolParity } from '../../../../../../tests/validation/parallel-validator.js';
import { sessionManager } from '../../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../../utils/execution-context.js';

interface MittwaldUserApiTokenRevokeArgs {
  tokenId: string;
  confirm?: boolean;
  force?: boolean;
  quiet?: boolean;
}

function buildCliArgs(args: MittwaldUserApiTokenRevokeArgs): string[] {
  const cliArgs: string[] = ['user', 'api-token', 'revoke', args.tokenId];

  if (args.force) cliArgs.push('--force');
  if (args.quiet) cliArgs.push('--quiet');

  return cliArgs;
}

function parseQuietOutput(output: string): string | undefined {
  const trimmed = output.trim();
  if (!trimmed) return undefined;
  const lines = trimmed.split(/\r?\n/);
  return lines.at(-1);
}

function mapCliError(error: CliToolError, args: MittwaldUserApiTokenRevokeArgs): string {
  const combined = `${error.stdout ?? ''}\n${error.stderr ?? ''}`;
  const combinedLower = combined.toLowerCase();

  if (combinedLower.includes('not found') || combinedLower.includes('no token found')) {
    return `API token not found: ${args.tokenId}.\nError: ${error.stderr || error.message}`;
  }

  const rawMessage = error.stderr || error.stdout || error.message;
  return `Failed to revoke API token: ${rawMessage}`;
}

function buildSuccessPayload(
  args: MittwaldUserApiTokenRevokeArgs,
  output: string,
): Record<string, unknown> {
  return {
    tokenId: args.tokenId,
    revoked: true,
    output,
    force: args.force,
    quiet: args.quiet,
  };
}

export const handleUserApiTokenRevokeCli: MittwaldCliToolHandler<MittwaldUserApiTokenRevokeArgs> = async (args, sessionId) => {
  if (!args.tokenId) {
    return formatToolResponse('error', 'Token ID is required.');
  }

  if (args.confirm !== true) {
    return formatToolResponse(
      'error',
      'API token revocation requires confirm=true. This operation is destructive and cannot be undone.'
    );
  }

  const effectiveSessionId = sessionId || getCurrentSessionId();
  const resolvedSessionId = typeof sessionId === 'string' ? sessionId : (sessionId as any)?.sessionId;
  const resolvedUserId = typeof sessionId === 'string' ? undefined : (sessionId as any)?.userId;

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  logger.warn('[UserApiTokenRevoke] Destructive operation attempted', {
    tokenId: args.tokenId,
    force: Boolean(args.force),
    quiet: Boolean(args.quiet),
    sessionId: resolvedSessionId,
    ...(resolvedUserId ? { userId: resolvedUserId } : {}),
  });

  const argv = buildCliArgs(args);

  try {
    // WP04: Parallel validation - run both CLI and library
    const validation = await validateToolParity({
      toolName: 'mittwald_user_api_token_revoke',
      cliCommand: 'mw',
      cliArgs: [...argv, '--token', session.mittwaldAccessToken],
      libraryFn: async () => {
        return await revokeUserApiToken({
          tokenId: args.tokenId,
          apiToken: session.mittwaldAccessToken,
        });
      },
      ignoreFields: ['durationMs', 'duration', 'timestamp'],
    });

    // Log validation results
    if (!validation.passed) {
      logger.warn('[WP04 Validation] Output mismatch detected', {
        tool: 'mittwald_user_api_token_revoke',
        tokenId: args.tokenId,
        discrepancyCount: validation.discrepancies.length,
        discrepancies: validation.discrepancies,
        cliExitCode: validation.cliOutput.exitCode,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
      });
    } else {
      logger.info('[WP04 Validation] 100% parity achieved', {
        tool: 'mittwald_user_api_token_revoke',
        tokenId: args.tokenId,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
        speedup: `${((validation.cliOutput.durationMs / validation.libraryOutput.durationMs) * 100).toFixed(0)}%`,
      });
    }

    const output = `API token ${args.tokenId} revoked successfully`;

    if (args.quiet) {
      const quietOutput = output;
      return formatToolResponse(
        'success',
        quietOutput || 'API token revoked successfully',
        buildSuccessPayload(args, quietOutput),
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
      output || `API token ${args.tokenId} revoked successfully`,
      buildSuccessPayload(args, output),
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

    logger.error('[WP04] Unexpected error in user api token revoke handler', { error });
    return formatToolResponse(
      'error',
      `Failed to revoke API token: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
