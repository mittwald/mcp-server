import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { MittwaldAPIV2Client } from '@mittwald/api-client';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';
import { logger } from '../../../../utils/logger.js';

interface MittwaldContainerLogsArgs {
  containerId: string;
  projectId: string;
  tail?: number;
}

export const handleContainerLogsCli: MittwaldCliToolHandler<MittwaldContainerLogsArgs> = async (args, sessionId) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();
  const startTime = performance.now();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  if (!args.containerId) {
    return formatToolResponse('error', 'containerId is required. Use mittwald_container_list to find the containerId.');
  }

  if (!args.projectId) {
    return formatToolResponse('error', 'projectId is required.');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  try {
    const client = MittwaldAPIV2Client.newWithToken(session.mittwaldAccessToken);

    // projectId can be used directly as stackId
    const response = await client.container.getServiceLogs({
      stackId: args.projectId,
      serviceId: args.containerId,
      queryParameters: args.tail ? { tail: args.tail } : undefined,
    });

    const durationMs = performance.now() - startTime;

    if (response.status !== 200) {
      const errorData = response.data as { message?: string } | undefined;
      return formatToolResponse('error', `Failed to retrieve logs: ${errorData?.message || `HTTP ${response.status}`}`, {
        status: response.status,
        projectId: args.projectId,
        containerId: args.containerId,
      });
    }

    const logs = response.data as string;

    if (!logs || !logs.trim()) {
      return formatToolResponse(
        'success',
        'No logs found for the specified container',
        {
          containerId: args.containerId,
          projectId: args.projectId,
          logs: '',
        },
        { durationMs }
      );
    }

    return formatToolResponse(
      'success',
      `Retrieved logs for container ${args.containerId}`,
      {
        containerId: args.containerId,
        projectId: args.projectId,
        logs,
        lineCount: logs.split('\n').filter(line => line.trim()).length,
      },
      { durationMs }
    );
  } catch (error) {
    logger.error('Error fetching container logs', { error, args });

    const errorMessage = error instanceof Error ? error.message : String(error);
    const status = (error as any)?.status;

    if (status === 404) {
      return formatToolResponse('error', `Container not found. Verify projectId (${args.projectId}) and containerId (${args.containerId}).`, {
        containerId: args.containerId,
        projectId: args.projectId,
        suggestedAction: 'Use mittwald_container_list to verify the correct IDs.',
      });
    }

    if (status === 403) {
      return formatToolResponse('error', 'Access denied. You may not have permission to view logs for this container.', {
        containerId: args.containerId,
        projectId: args.projectId,
      });
    }

    return formatToolResponse('error', `Failed to retrieve container logs: ${errorMessage}`);
  }
};
