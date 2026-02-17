import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { createMysqlDatabase, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../../utils/execution-context.js';
import { logger } from '../../../../../utils/logger.js';

interface MittwaldDatabaseMysqlCreateArgs {
  description: string;
  version: string;
  projectId?: string;
  quiet?: boolean;
  collation?: string;
  characterSet?: string;
  userPassword?: string;
  userExternal?: boolean;
  userAccessLevel?: "full" | "readonly";
  timeout?: string;
  enable?: boolean;
  disable?: boolean;
  email?: string;
  url?: string;
  command?: string;
  interpreter?: string;
}

export const handleDatabaseMysqlCreateCli: MittwaldCliToolHandler<MittwaldDatabaseMysqlCreateArgs> = async (args, sessionId) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  if (!args.projectId) {
    return formatToolResponse(
      'error',
      "Project ID is required for database creation. Please provide --project-id or set a default project context via 'mw context set --project-id=<PROJECT_ID>'."
    );
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  try {
    // API requires both characterSet and collation when character settings are provided.
    const characterSettings =
      args.characterSet && args.collation
        ? {
            characterSet: args.characterSet,
            collation: args.collation,
          }
        : undefined;

    const result = await createMysqlDatabase({
      projectId: args.projectId!,
      description: args.description,
      version: args.version,
      characterSettings,
      userPassword: args.userPassword,
      userAccessLevel: args.userAccessLevel,
      userExternalAccess: args.userExternal,
      apiToken: session.mittwaldAccessToken,
    });

    return formatToolResponse(
      'success',
      `Successfully created MySQL database '${args.description}'`,
      result.data,
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

    logger.error('[WP06] Unexpected error in database mysql create handler', { error });
    return formatToolResponse('error', `Failed to create MySQL database: ${error instanceof Error ? error.message : String(error)}`);
  }
};
