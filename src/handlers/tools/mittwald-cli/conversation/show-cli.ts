import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { getConversation, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';

interface MittwaldConversationShowArgs {
  conversationId: string;
}

export const handleConversationShowCli: MittwaldCliToolHandler<MittwaldConversationShowArgs> = async (args, sessionId) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  if (!args.conversationId) {
    return formatToolResponse('error', 'conversationId is required');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  try {
    const conversation = await getConversation({
      conversationId: args.conversationId,
      apiToken: session.mittwaldAccessToken,
    });

    return formatToolResponse(
      'success',
      `Retrieved conversation: ${args.conversationId}`,
      {
        conversationId: args.conversationId,
        ...conversation,
      }
    );
  } catch (error) {
    if (error instanceof LibraryError) {
      // Handle special cases
      const message = error.message.toLowerCase();
      if (message.includes('not found') && message.includes('conversation')) {
        return formatToolResponse('error', `Conversation not found with ID: ${args.conversationId}.\nError: ${error.message}`, {
          code: error.code,
          details: error.details,
        });
      }

      return formatToolResponse('error', error.message, {
        code: error.code,
        details: error.details,
      });
    }

    return formatToolResponse('error', `Failed to get conversation: ${error instanceof Error ? error.message : String(error)}`);
  }
};
