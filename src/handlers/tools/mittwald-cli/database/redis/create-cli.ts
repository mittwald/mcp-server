import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { createRedisDatabase, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../../utils/execution-context.js';
import { logger } from '../../../../../utils/logger.js';
import { buildSecureToolResponse } from '../../../../../utils/credential-response.js';

interface MittwaldDatabaseRedisCreateArgs {
  projectId: string;
  description: string;
  version: string;
  persistent?: boolean;
  maxMemory?: string;
  maxMemoryPolicy?:
    | 'noeviction'
    | 'allkeys-lru'
    | 'allkeys-lfu'
    | 'volatile-lru'
    | 'volatile-lfu'
    | 'allkeys-random'
    | 'volatile-random'
    | 'volatile-ttl';
  quiet?: boolean;
}

export const handleDatabaseRedisCreateCli: MittwaldCliToolHandler<MittwaldDatabaseRedisCreateArgs> = async (
  args,
  sessionId,
) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return buildSecureToolResponse('error', 'Session ID required');
  }

  if (!args.projectId) {
    return buildSecureToolResponse('error', 'Project ID is required to create a Redis database.');
  }

  if (!args.description) {
    return buildSecureToolResponse('error', 'Description is required to create a Redis database.');
  }

  if (!args.version) {
    return buildSecureToolResponse('error', 'Version is required to create a Redis database.');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return buildSecureToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  try {
    const result = await createRedisDatabase({
      projectId: args.projectId,
      description: args.description,
      version: args.version,
      apiToken: session.mittwaldAccessToken,
    });

    return buildSecureToolResponse(
      'success',
      `Created Redis database in project ${args.projectId}.`,
      result.data,
      {
        durationMs: result.durationMs,
      }
    );
  } catch (error) {
    if (error instanceof LibraryError) {
      return buildSecureToolResponse('error', error.message, {
        code: error.code,
        details: error.details,
      });
    }

    logger.error('[WP06] Unexpected error in database redis create handler', { error });
    return buildSecureToolResponse('error', `Failed to create Redis database: ${error instanceof Error ? error.message : String(error)}`);
  }
};
