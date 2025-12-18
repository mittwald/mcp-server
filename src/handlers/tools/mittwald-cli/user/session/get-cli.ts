import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../../tools/index.js';
import { getUserSession, LibraryError } from '@mittwald-mcp/cli-core';
import { validateToolParity } from '../../../../../../tests/validation/parallel-validator.js';
import { sessionManager } from '../../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../../utils/execution-context.js';
import { logger } from '../../../../../utils/logger.js';

interface MittwaldUserSessionGetArgs {
  tokenId: string;
  output?: 'txt' | 'json' | 'yaml';
}

interface RawSession {
  id?: string;
  tokenId?: string;
  createdAt?: string;
  expiresAt?: string;
  userAgent?: string;
  ipAddress?: string;
  [key: string]: unknown;
}

function buildCliArgs(tokenId: string): string[] {
  return ['user', 'session', 'get', tokenId, '--output', 'json'];
}

function parseSession(stdout: string): RawSession {
  const lines = stdout.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || (!line.startsWith('{') && !line.startsWith('['))) continue;

    let snippet = line;
    for (let j = i + 1; j < lines.length; j++) {
      snippet += '\n' + lines[j];
      try {
        const parsed = JSON.parse(snippet);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          return parsed as RawSession;
        }
      } catch {
        // Continue accumulating until JSON parses successfully
      }
    }

    const parsed = JSON.parse(snippet);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as RawSession;
    }
  }

  const parsed = JSON.parse(stdout);
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    return parsed as RawSession;
  }

  throw new Error('Unexpected output format from CLI command');
}

function mapCliError(error: CliToolError, tokenId: string): string {
  const stdout = error.stdout ?? '';
  const stderr = error.stderr ?? '';
  const combinedLower = `${stdout}\n${stderr}`.toLowerCase();

  if (combinedLower.includes('not found') || combinedLower.includes('no session found')) {
    return `Session not found: ${tokenId}.\nError: ${stderr || error.message}`;
  }

  const rawMessage = stderr || stdout || error.message;
  return `Failed to get session: ${rawMessage}`;
}

export const handleUserSessionGetCli: MittwaldCliToolHandler<MittwaldUserSessionGetArgs> = async (args, sessionId) => {
  if (!args.tokenId || !args.tokenId.trim()) {
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

  const argv = buildCliArgs(args.tokenId);

  try {
    // WP04: Parallel validation - run both CLI and library
    const validation = await validateToolParity({
      toolName: 'mittwald_user_session_get',
      cliCommand: 'mw',
      cliArgs: [...argv, '--token', session.mittwaldAccessToken],
      libraryFn: async () => {
        return await getUserSession({
          sessionId: args.tokenId,
          apiToken: session.mittwaldAccessToken,
        });
      },
      ignoreFields: ['durationMs', 'duration', 'timestamp'],
    });

    // Log validation results
    if (!validation.passed) {
      logger.warn('[WP04 Validation] Output mismatch detected', {
        tool: 'mittwald_user_session_get',
        tokenId: args.tokenId,
        discrepancyCount: validation.discrepancies.length,
        discrepancies: validation.discrepancies,
        cliExitCode: validation.cliOutput.exitCode,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
      });
    } else {
      logger.info('[WP04 Validation] 100% parity achieved', {
        tool: 'mittwald_user_session_get',
        tokenId: args.tokenId,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
        speedup: `${((validation.cliOutput.durationMs / validation.libraryOutput.durationMs) * 100).toFixed(0)}%`,
      });
    }

    // Use library result (it's validated)
    const sessionData = validation.libraryOutput.data;
    const formattedData = {
      id: sessionData.id,
      tokenId: sessionData.tokenId,
      createdAt: sessionData.createdAt,
      expiresAt: sessionData.expiresAt,
      userAgent: sessionData.userAgent,
      ipAddress: sessionData.ipAddress,
      ...sessionData,
    };

    return formatToolResponse(
      'success',
      `Session information retrieved for ${args.tokenId}`,
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
      const message = mapCliError(error, args.tokenId);
      return formatToolResponse('error', message, {
        exitCode: error.exitCode,
        stderr: error.stderr,
        stdout: error.stdout,
        suggestedAction: error.suggestedAction,
      });
    }

    logger.error('[WP04] Unexpected error in user session get handler', { error });
    return formatToolResponse('error', `Failed to get session: ${error instanceof Error ? error.message : String(error)}`);
  }
};
