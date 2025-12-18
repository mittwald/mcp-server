import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';
import { getServer, LibraryError } from '@mittwald-mcp/cli-core';
import { validateToolParity } from '../../../../../tests/validation/parallel-validator.js';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';
import { logger } from '../../../../utils/logger.js';

interface MittwaldServerGetArgs {
  serverId?: string;
  output?: 'txt' | 'json' | 'yaml';
}

function buildCliArgs(args: MittwaldServerGetArgs): string[] {
  const cliArgs: string[] = ['server', 'get'];
  if (args.serverId) cliArgs.push(args.serverId);
  cliArgs.push('--output', 'json');
  return cliArgs;
}

function mapCliError(error: CliToolError, args: MittwaldServerGetArgs): string {
  const stderr = error.stderr ?? '';
  const stdout = error.stdout ?? '';
  const combined = `${stderr}\n${stdout}\n${error.message}`.toLowerCase();

  if (combined.includes('not found') || combined.includes('no server found')) {
    const details = stderr || stdout || error.message;
    return `Server not found. Please verify the server ID: ${args.serverId || 'not specified'}.\nError: ${details}`;
  }

  const details = stderr || stdout || error.message;
  return `Failed to get server: ${details}`;
}

function formatServer(record: Record<string, unknown>) {
  return {
    id: record.id,
    description: record.description,
    createdAt: record.createdAt,
    isReady: record.isReady,
    status: record.status,
    data: record,
  };
}

export const handleServerGetCli: MittwaldCliToolHandler<MittwaldServerGetArgs> = async (args, sessionId) => {
  if (!args.serverId) {
    return formatToolResponse('error', 'Server ID is required.');
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
    // WP05: Parallel validation - run both CLI and library
    const validation = await validateToolParity({
      toolName: 'mittwald_server_get',
      cliCommand: 'mw',
      cliArgs: [...argv, '--token', session.mittwaldAccessToken],
      libraryFn: async () => {
        return await getServer({
          serverId: args.serverId!,
          apiToken: session.mittwaldAccessToken,
        });
      },
      ignoreFields: ['durationMs', 'duration', 'timestamp'],
    });

    // Log validation results
    if (!validation.passed) {
      logger.warn('[WP05 Validation] Output mismatch detected', {
        tool: 'mittwald_server_get',
        serverId: args.serverId,
        discrepancyCount: validation.discrepancies.length,
        discrepancies: validation.discrepancies,
        cliExitCode: validation.cliOutput.exitCode,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
      });
    } else {
      logger.info('[WP05 Validation] 100% parity achieved', {
        tool: 'mittwald_server_get',
        serverId: args.serverId,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
        speedup: `${((validation.cliOutput.durationMs / validation.libraryOutput.durationMs) * 100).toFixed(0)}%`,
      });
    }

    // Use library result (it's validated) - data is object
    const server = validation.libraryOutput.data as Record<string, unknown>;
    const formatted = formatServer(server);

    return formatToolResponse(
      'success',
      `Server information retrieved for ${String(server.id ?? args.serverId ?? 'server')}`,
      formatted,
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

    logger.error('[WP05] Unexpected error in server get handler', { error });
    return formatToolResponse('error', `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`);
  }
};
