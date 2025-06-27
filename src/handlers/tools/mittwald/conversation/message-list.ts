import type { 
  MittwaldToolHandler, 
  ConversationMessageListArgs
} from '../../../../types/mittwald/conversation.js';
import { formatMittwaldToolResponse } from '../../../../types/mittwald/conversation.js';

export const handleMittwaldConversationMessageList: MittwaldToolHandler<ConversationMessageListArgs> = async (args, { mittwaldClient }) => {
  try {
    const { conversationId } = args;

    if (!conversationId) {
      throw new Error("conversationId is required");
    }

    const response = await mittwaldClient.api.conversation.listMessagesByConversation({
      conversationId
    });

    if (response.status !== 200) {
      throw new Error(`API returned status ${response.status}`);
    }

    return formatMittwaldToolResponse({
      message: "Successfully retrieved conversation messages",
      result: {
        messages: response.data,
        count: response.data?.length || 0
      },
    });
  } catch (error) {
    return formatMittwaldToolResponse({
      status: "error",
      message: `Failed to list conversation messages: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error,
      },
    });
  }
};