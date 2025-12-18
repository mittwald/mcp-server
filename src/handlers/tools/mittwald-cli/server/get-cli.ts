import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';
import { getServer, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';
import { logger } from '../../../../utils/logger.js';

interface MittwaldServerGetArgs {
  serverId?: string;
  output?: 'txt' | 'json' | 'yaml';
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

  try {
    const result = await getServer({
      serverId: args.serverId!,
      apiToken: session.mittwaldAccessToken,
    });

    const server = result.data as Record<string, unknown>;
    const formatted = formatServer(server);

    return formatToolResponse(
      'success',
      `Server information retrieved for ${String(server.id ?? args.serverId ?? 'server')}`,
      formatted,
      {
        durationMs: result.durationMs,
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
      const stderr = error.stderr ?? '';
      const stdout = error.stdout ?? '';
      const combined = `${stderr}\n${stdout}\n${error.message}`.toLowerCase();
      let message = `Failed to get server: ${stderr || stdout || error.message}`;

      if (combined.includes('not found') || combined.includes('no server found')) {
        message = `Server not found. Please verify the server ID: ${args.serverId || 'not specified'}.\nError: ${stderr || stdout || error.message}`;
      }

      return formatToolResponse('error', message, {
        exitCode: error.exitCode,
        stderr: error.stderr,
        stdout: error.stdout,
        suggestedAction: error.suggestedAction,
      });
    }

    logger.error('[WP06] Unexpected error in server get handler', { error });
    return formatToolResponse('error', `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`);
  }
};
