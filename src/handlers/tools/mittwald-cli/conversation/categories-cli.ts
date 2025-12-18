import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { listConversationCategories, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';

export const handleConversationCategoriesCli: MittwaldCliToolHandler = async (args, sessionId) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  try {
    const result = await listConversationCategories({
      apiToken: session.mittwaldAccessToken,
    });

    // Data is array directly
    const categories = result as any[];

    if (!categories || categories.length === 0) {
      return formatToolResponse(
        'success',
        'No conversation categories found',
        []
      );
    }

    return formatToolResponse(
      'success',
      `Found ${categories.length} conversation category(ies)`,
      categories
    );
  } catch (error) {
    if (error instanceof LibraryError) {
      return formatToolResponse('error', error.message, {
        code: error.code,
        details: error.details,
      });
    }

    return formatToolResponse('error', `Failed to list conversation categories: ${error instanceof Error ? error.message : String(error)}`);
  }
};
