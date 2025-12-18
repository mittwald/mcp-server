import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { updateCronjob, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';
import { logger } from '../../../../utils/logger.js';

interface MittwaldCronjobUpdateCliArgs {
  cronjobId: string;
  quiet?: boolean;
  description?: string;
  interval?: string;
  email?: string;
  url?: string;
  command?: string;
  interpreter?: 'bash' | 'php';
  enable?: boolean;
  disable?: boolean;
  timeout?: string;
}

export const handleCronjobUpdateCli: MittwaldCliToolHandler<MittwaldCronjobUpdateCliArgs> = async (args, sessionId) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  if (!args.cronjobId) {
    return formatToolResponse('error', 'cronjobId is required');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  try {
    // Build destination object if url or command is provided
    let destination: { url: string } | { interpreter: string; path: string } | undefined;
    if (args.url) {
      destination = { url: args.url };
    } else if (args.command && args.interpreter) {
      destination = { interpreter: args.interpreter, path: args.command };
    }

    // Parse timeout if provided
    const timeoutMs = args.timeout ? parseInt(args.timeout.replace(/[^\d]/g, '')) * 1000 : undefined;

    // Determine active state
    let active: boolean | undefined;
    if (args.enable) active = true;
    if (args.disable) active = false;

    const result = await updateCronjob({
      cronjobId: args.cronjobId,
      description: args.description,
      interval: args.interval,
      email: args.email,
      destination,
      timeout: timeoutMs,
      active,
      apiToken: session.mittwaldAccessToken,
    });

    return formatToolResponse(
      'success',
      'Cronjob updated successfully',
      {
        cronjobId: args.cronjobId,
        description: args.description,
        interval: args.interval,
        email: args.email,
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

    logger.error('[WP06] Unexpected error in cronjob update handler', { error });
    return formatToolResponse('error', `Failed to update cronjob: ${error instanceof Error ? error.message : String(error)}`);
  }
};
