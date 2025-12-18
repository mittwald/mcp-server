import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { replyToConversation, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';

interface MittwaldConversationReplyArgs {
  conversationId: string;
  message?: string;
  messageFrom?: string;
  editor?: string;
}

export const handleConversationReplyCli: MittwaldCliToolHandler<MittwaldConversationReplyArgs> = async (args, sessionId) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  if (!args.conversationId) {
    return formatToolResponse('error', 'conversationId is required');
  }

  if (!args.message && !args.messageFrom) {
    return formatToolResponse('error', 'No message provided. Please provide either a message or messageFrom parameter.');
  }

  if (!args.message && args.messageFrom === '-') {
    return formatToolResponse(
      'error',
      'Reading from stdin is not supported in the MCP context. Please provide the message directly using the message parameter.'
    );
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  try {
    const result = await replyToConversation({
      conversationId: args.conversationId,
      message: args.message!,
      apiToken: session.mittwaldAccessToken,
    });

    const messageId = result?.messageId ?? result?.id;

    return formatToolResponse(
      'success',
      `Reply sent to conversation: ${args.conversationId}`,
      {
        conversationId: args.conversationId,
        messageId,
        ...result,
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

    return formatToolResponse('error', `Failed to reply to conversation: ${error instanceof Error ? error.message : String(error)}`);
  }
};
