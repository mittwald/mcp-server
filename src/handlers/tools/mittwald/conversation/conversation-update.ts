import type { 
  MittwaldToolHandler, 
  ConversationUpdateArgs,
  formatMittwaldToolResponse 
} from '../../../../types/mittwald/conversation.js';
import { formatMittwaldToolResponse } from "../../../../types/mittwald/conversation.js";
export const handleMittwaldConversationUpdate: MittwaldToolHandler<ConversationUpdateArgs> = async (args, { mittwaldClient }) => {
  try {
    const { conversationId, categoryId, relatedTo, title } = args;

    if (!conversationId) {
      throw new Error("conversationId is required");
    }

    const updateData: any = {};
    if (categoryId) updateData.categoryId = categoryId;
    if (relatedTo) updateData.relatedTo = relatedTo;
    if (title) updateData.title = title;

    const response = await mittwaldClient.api.conversation.updateConversation({
      pathParameters: { conversationId },
      data: updateData
    });

    if (response.status !== 200) {
      throw new Error(`API returned status ${response.status}`);
    }

    return formatMittwaldToolResponse({
      message: "Successfully updated conversation",
      result: {
        conversation: response.data
      },
    });
  } catch (error) {
    return formatMittwaldToolResponse({
      status: "error",
      message: `Failed to update conversation: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error,
      },
    });
  }
};