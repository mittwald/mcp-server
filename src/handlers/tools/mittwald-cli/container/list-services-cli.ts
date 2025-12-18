import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';
import { listContainers, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';
import { logger } from '../../../../utils/logger.js';

interface MittwaldContainerListArgs {
  projectId?: string;
  output?: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
  extended?: boolean;
  noHeader?: boolean;
  noTruncate?: boolean;
  noRelativeDates?: boolean;
  csvSeparator?: ',' | ';';
}

type RawContainer = {
  id?: string;
  status?: string;
  stackId?: string;
  projectId?: string;
  name?: string;
  image?: string;
  ports?: unknown;
  volumes?: unknown;
  createdAt?: string;
  updatedAt?: string;
};


function formatContainers(containers: RawContainer[]) {
  return containers.map((item) => ({
    id: item.id,
    status: item.status,
    stackId: item.stackId,
    projectId: item.projectId,
    name: item.name ?? item.id,
    image: item.image,
    ports: item.ports ?? [],
    volumes: item.volumes ?? [],
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }));
}


export const handleContainerListCli: MittwaldCliToolHandler<MittwaldContainerListArgs> = async (args, sessionId) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  if (!args.projectId) {
    return formatToolResponse('error', 'projectId is required');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  try {
    const result = await listContainers({
      projectId: args.projectId!,
      apiToken: session.mittwaldAccessToken,
    });

    const containers = result.data as any[];

    if (!containers || containers.length === 0) {
      return formatToolResponse(
        'success',
        'No containers found',
        [],
        {
          durationMs: result.durationMs,
        }
      );
    }

    return formatToolResponse(
      'success',
      `Found ${containers.length} container(s)`,
      formatContainers(containers),
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
      const combined = `${error.stdout ?? ''}\n${error.stderr ?? ''}`.toLowerCase();
      let message = error.message;

      if (combined.includes('not found') && combined.includes('project')) {
        message = `Project not found. Please verify the project ID: ${args.projectId ?? 'not specified'}.\nError: ${error.stderr || error.message}`;
      }

      return formatToolResponse('error', message, {
        exitCode: error.exitCode,
        stderr: error.stderr,
        stdout: error.stdout,
        suggestedAction: error.suggestedAction,
      });
    }

    logger.error('[WP06] Unexpected error in container list handler', { error });
    return formatToolResponse('error', `Failed to list containers: ${error instanceof Error ? error.message : String(error)}`);
  }
};
