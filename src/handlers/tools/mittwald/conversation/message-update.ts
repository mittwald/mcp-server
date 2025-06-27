import type { 
  MittwaldToolHandler, 
  ConversationMessageUpdateArgs,
  formatMittwaldToolResponse 
} from '../../../../types/mittwald/conversation.js';
import { formatMittwaldToolResponse } from "../../../../types/mittwald/conversation.js";
export const handleMittwaldConversationMessageUpdate: MittwaldToolHandler<ConversationMessageUpdateArgs> = async (args, { mittwaldClient }) => {
  try {
    const { conversationId, messageId, messageContent } = args;

    if (!conversationId) {
      throw new Error("conversationId is required");
    }

    if (!messageId) {
      throw new Error("messageId is required");
    }

    if (!messageContent) {
      throw new Error("messageContent is required");
    }

    const response = await mittwaldClient.api.conversation.updateMessage({
      pathParameters: { conversationId, messageId },
      data: { messageContent }
    });

    if (response.status !== 200) {
      throw new Error(`API returned status ${response.status}`);
    }

    return formatMittwaldToolResponse({
      message: "Successfully updated message",
      result: {
        message: response.data
      },
    });
  } catch (error) {
    return formatMittwaldToolResponse({
      status: "error",
      message: `Failed to update message: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error,
      },
    });
  }
};