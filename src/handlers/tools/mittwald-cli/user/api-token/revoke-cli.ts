import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { logger } from '../../../../../utils/logger.js';
import { invokeCliTool, CliToolError } from '../../../../../tools/index.js';

interface MittwaldUserApiTokenRevokeArgs {
  tokenId: string;
  confirm?: boolean;
  force?: boolean;
}

function buildCliArgs(args: MittwaldUserApiTokenRevokeArgs): string[] {
  const cliArgs: string[] = ['user', 'api-token', 'revoke', args.tokenId];

  if (args.force) cliArgs.push('--force');

  return cliArgs;
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
  };
}

export const handleUserApiTokenRevokeCli: MittwaldCliToolHandler<MittwaldUserApiTokenRevokeArgs> = async (args, sessionId) => {
  const resolvedSessionId = typeof sessionId === 'string' ? sessionId : (sessionId as any)?.sessionId;
  const resolvedUserId = typeof sessionId === 'string' ? undefined : (sessionId as any)?.userId;
  if (!args.tokenId) {
    return formatToolResponse('error', 'Token ID is required.');
  }

  if (args.confirm !== true) {
    return formatToolResponse(
      'error',
      'API token revocation requires confirm=true. This operation is destructive and cannot be undone.'
    );
  }

  logger.warn('[UserApiTokenRevoke] Destructive operation attempted', {
    tokenId: args.tokenId,
    force: Boolean(args.force),
    sessionId: resolvedSessionId,
    ...(resolvedUserId ? { userId: resolvedUserId } : {}),
  });

  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_user_api_token_revoke',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout ?? '';
    const stderr = result.result.stderr ?? '';
    const output = stdout || stderr || `API token ${args.tokenId} revoked successfully`;

    return formatToolResponse(
      'success',
      output || `API token ${args.tokenId} revoked successfully`,
      buildSuccessPayload(args, output),
      {
        command: result.meta.command,
        durationMs: result.meta.durationMs,
      }
    );
  } catch (error) {
    if (error instanceof CliToolError) {
      const message = mapCliError(error, args);
      return formatToolResponse('error', message, {
        exitCode: error.exitCode,
        stderr: error.stderr,
        stdout: error.stdout,
        suggestedAction: error.suggestedAction,
      });
    }

    return formatToolResponse(
      'error',
      `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
