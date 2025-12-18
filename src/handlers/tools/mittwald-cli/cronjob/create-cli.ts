import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { createCronjob, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';
import { logger } from '../../../../utils/logger.js';

interface MittwaldCronjobCreateCliArgs {
  description: string;
  interval: string;
  installationId?: string;
  projectId?: string;
  quiet?: boolean;
  email?: string;
  url?: string;
  command?: string;
  interpreter?: 'bash' | 'php';
  disable?: boolean;
  timeout?: string;
}

export const handleCronjobCreateCli: MittwaldCliToolHandler<MittwaldCronjobCreateCliArgs> = async (args, sessionId) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  if (!args.description) {
    return formatToolResponse('error', 'description is required');
  }

  if (!args.interval) {
    return formatToolResponse('error', 'interval is required');
  }

  if (!args.projectId && !args.installationId) {
    return formatToolResponse('error', 'Either projectId or installationId is required');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  try {
    // Build destination object for library function
    let destination: { url: string } | { interpreter: string; path: string };
    if (args.url) {
      destination = { url: args.url };
    } else if (args.command && args.interpreter) {
      destination = { interpreter: args.interpreter, path: args.command };
    } else {
      return formatToolResponse('error', 'Either url or (command + interpreter) must be provided');
    }

    // Parse timeout (CLI accepts string like "60s", library expects number)
    const timeoutMs = args.timeout ? parseInt(args.timeout.replace(/[^\d]/g, '')) * 1000 : 60000;

    const result = await createCronjob({
      projectId: args.projectId!,
      appId: args.installationId!,
      description: args.description,
      interval: args.interval,
      timeout: timeoutMs,
      active: !args.disable,
      email: args.email,
      destination,
      apiToken: session.mittwaldAccessToken,
    });

    const cronjobId = result.data?.id || result.data;

    return formatToolResponse(
      'success',
      'Cronjob created successfully',
      {
        id: cronjobId,
        description: args.description,
        interval: args.interval,
      },
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

    logger.error('[WP06] Unexpected error in cronjob create handler', { error });
    return formatToolResponse('error', `Failed to create cronjob: ${error instanceof Error ? error.message : String(error)}`);
  }
};
