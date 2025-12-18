import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { createConversation, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';

interface MittwaldConversationCreateArgs {
  title: string;
  message?: string;
  messageFrom?: string;
  editor?: string;
  category?: string;
}

export const handleConversationCreateCli: MittwaldCliToolHandler<MittwaldConversationCreateArgs> = async (args, sessionId) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  if (!args.title) {
    return formatToolResponse('error', 'title is required');
  }

  if (!args.message) {
    if (!args.messageFrom) {
      return formatToolResponse('error', 'No message provided. Please provide either a message or messageFrom parameter.');
    }

    if (args.messageFrom === '-') {
      return formatToolResponse(
        'error',
        'Reading from stdin is not supported in the MCP context. Please provide the message directly using the message parameter.'
      );
    }
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  try {
    const result = await createConversation({
      title: args.title,
      categoryId: args.category || '',
      apiToken: session.mittwaldAccessToken,
    });

    const conversationData = result.data as any;
    const conversationId = conversationData?.conversationId ?? conversationData?.id;

    return formatToolResponse(
      'success',
      'Conversation created successfully',
      {
        conversationId,
        title: args.title,
        category: args.category,
        ...conversationData,
      }
    );
  } catch (error) {
    if (error instanceof LibraryError) {
      // Handle special cases
      const message = error.message.toLowerCase();
      if (message.includes('category') && message.includes('not found')) {
        return formatToolResponse('error', `Category not found: ${args.category}. Use conversation categories command to list available categories.\nError: ${error.message}`, {
          code: error.code,
          details: error.details,
        });
      }

      return formatToolResponse('error', error.message, {
        code: error.code,
        details: error.details,
      });
    }

    return formatToolResponse('error', `Failed to create conversation: ${error instanceof Error ? error.message : String(error)}`);
  }
};
