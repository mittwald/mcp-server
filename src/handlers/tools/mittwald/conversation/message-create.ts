import type { 
  MittwaldToolHandler, 
  ConversationMessageCreateArgs,
  formatMittwaldToolResponse 
} from '../../../../types/mittwald/conversation.js';
import { formatMittwaldToolResponse } from "../../../../types/mittwald/conversation.js";
export const handleMittwaldConversationMessageCreate: MittwaldToolHandler<ConversationMessageCreateArgs> = async (args, { mittwaldClient }) => {
  try {
    const { conversationId, messageContent, fileIds } = args;

    if (!conversationId) {
      throw new Error("conversationId is required");
    }

    if (!messageContent) {
      throw new Error("messageContent is required");
    }

    if (messageContent.length > 8000) {
      throw new Error("messageContent cannot exceed 8000 characters");
    }

    const response = await mittwaldClient.api.conversation.createMessage({
      pathParameters: { conversationId },
      data: {
        messageContent,
        ...(fileIds && { fileIds })
      }
    });

    if (response.status !== 201) {
      throw new Error(`API returned status ${response.status}`);
    }

    return formatMittwaldToolResponse({
      message: "Successfully created message",
      result: {
        message: response.data
      },
    });
  } catch (error) {
    return formatMittwaldToolResponse({
      status: "error",
      message: `Failed to create message: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error,
      },
    });
  }
};