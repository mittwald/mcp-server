import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';

interface ConversationCloseArgs {
  conversationId?: string;
}

export const handleConversationClose: MittwaldToolHandler<ConversationCloseArgs> = async (args, { mittwaldClient }) => {
  try {
    const conversationId = args.conversationId;
    
    if (!conversationId) {
      return formatToolResponse(
        "error",
        "No conversation ID provided and no default conversation set in context. Please provide a conversation ID."
      );
    }
    
    // Close the conversation using the API
    const result = await mittwaldClient.api.conversation.setConversationStatus({
      conversationId: conversationId,
      data: {
        status: "closed"
      }
    });
    
    if (result.status !== 200) {
      return formatToolResponse(
        "error",
        `Failed to close conversation ${conversationId}`
      );
    }
    
    return formatToolResponse(
      "success",
      `Conversation ${conversationId} has been closed successfully.`,
      { conversationId, status: "closed" }
    );
  } catch (error) {
    return formatToolResponse(
      "error",
      `Error closing conversation: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};