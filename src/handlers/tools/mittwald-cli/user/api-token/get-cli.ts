import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../../tools/index.js';
import { getUserApiToken, LibraryError } from '@mittwald-mcp/cli-core';
import { validateToolParity } from '../../../../../../tests/validation/parallel-validator.js';
import { sessionManager } from '../../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../../utils/execution-context.js';
import { logger } from '../../../../../utils/logger.js';

interface MittwaldUserApiTokenGetArgs {
  tokenId: string;
  output?: 'txt' | 'json' | 'yaml';
}

function buildCliArgs(args: MittwaldUserApiTokenGetArgs): string[] {
  return ['user', 'api-token', 'get', args.tokenId, '--output', 'json'];
}

function parseApiTokenOutput(output: string): Record<string, unknown> {
  const lines = output.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line.startsWith('{') && !line.startsWith('[')) {
      continue;
    }

    let jsonStr = line;
    for (let j = i + 1; j < lines.length; j++) {
      jsonStr += '\n' + lines[j];
      try {
        const parsed = JSON.parse(jsonStr);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          return parsed as Record<string, unknown>;
        }
      } catch {
        // Continue collecting lines until JSON parses
      }
    }

    const parsed = JSON.parse(jsonStr);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  }

  const parsed = JSON.parse(output);
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    return parsed as Record<string, unknown>;
  }

  throw new Error('Parsed output is not an object.');
}

function mapCliError(error: CliToolError, args: MittwaldUserApiTokenGetArgs): string {
  const combined = `${error.stdout ?? ''}\n${error.stderr ?? ''}`;
  const combinedLower = combined.toLowerCase();

  if (combinedLower.includes('not found') || combinedLower.includes('no token found')) {
    return `API token not found: ${args.tokenId}.\nError: ${error.stderr || error.message}`;
  }

  const rawMessage = error.stderr || error.stdout || error.message;
  return `Failed to get API token: ${rawMessage}`;
}

export const handleUserApiTokenGetCli: MittwaldCliToolHandler<MittwaldUserApiTokenGetArgs> = async (args, sessionId) => {
  if (!args.tokenId) {
    return formatToolResponse('error', 'Token ID is required.');
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
    // WP04: Parallel validation - run both CLI and library
    const validation = await validateToolParity({
      toolName: 'mittwald_user_api_token_get',
      cliCommand: 'mw',
      cliArgs: [...argv, '--token', session.mittwaldAccessToken],
      libraryFn: async () => {
        return await getUserApiToken({
          tokenId: args.tokenId,
          apiToken: session.mittwaldAccessToken,
        });
      },
      ignoreFields: ['durationMs', 'duration', 'timestamp'],
    });

    // Log validation results
    if (!validation.passed) {
      logger.warn('[WP04 Validation] Output mismatch detected', {
        tool: 'mittwald_user_api_token_get',
        tokenId: args.tokenId,
        discrepancyCount: validation.discrepancies.length,
        discrepancies: validation.discrepancies,
        cliExitCode: validation.cliOutput.exitCode,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
      });
    } else {
      logger.info('[WP04 Validation] 100% parity achieved', {
        tool: 'mittwald_user_api_token_get',
        tokenId: args.tokenId,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
        speedup: `${((validation.cliOutput.durationMs / validation.libraryOutput.durationMs) * 100).toFixed(0)}%`,
      });
    }

    // Use library result (it's validated)
    const parsed = validation.libraryOutput.data;
    const formattedData = {
      id: parsed.id,
      description: parsed.description,
      roles: parsed.roles,
      createdAt: parsed.createdAt,
      expiresAt: parsed.expiresAt,
      ...parsed,
    };

    return formatToolResponse(
      'success',
      `API token information retrieved for ${args.tokenId}`,
      formattedData,
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

    logger.error('[WP04] Unexpected error in user api token get handler', { error });
    return formatToolResponse('error', `Failed to get API token: ${error instanceof Error ? error.message : String(error)}`);
  }
};
