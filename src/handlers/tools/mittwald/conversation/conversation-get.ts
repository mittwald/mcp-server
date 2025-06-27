import type { 
  MittwaldToolHandler, 
  ConversationGetArgs
} from '../../../../types/mittwald/conversation.js';
import { formatMittwaldToolResponse } from '../../../../types/mittwald/conversation.js';

export const handleMittwaldConversationGet: MittwaldToolHandler<ConversationGetArgs> = async (args, { mittwaldClient }) => {
  try {
    const { conversationId } = args;

    if (!conversationId) {
      throw new Error("conversationId is required");
    }

    const response = await mittwaldClient.api.conversation.getConversation({
      conversationId
    });

    if (response.status !== 200) {
      throw new Error(`API returned status ${response.status}`);
    }

    return formatMittwaldToolResponse({
      message: "Successfully retrieved conversation",
      result: {
        conversation: response.data
      },
    });
  } catch (error) {
    return formatMittwaldToolResponse({
      status: "error",
      message: `Failed to get conversation: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error,
      },
    });
  }
};