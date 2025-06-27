import type { 
  MittwaldToolHandler, 
  ConversationMembersGetArgs
} from '../../../../types/mittwald/conversation.js';
import { formatMittwaldToolResponse } from '../../../../types/mittwald/conversation.js';

export const handleMittwaldConversationMembersGet: MittwaldToolHandler<ConversationMembersGetArgs> = async (args, { mittwaldClient }) => {
  try {
    const { conversationId } = args;

    if (!conversationId) {
      throw new Error("conversationId is required");
    }

    const response = await mittwaldClient.api.conversation.getConversationMembers({
      conversationId
    });

    if (response.status !== 200) {
      throw new Error(`API returned status ${response.status}`);
    }

    return formatMittwaldToolResponse({
      message: "Successfully retrieved conversation members",
      result: {
        members: response.data,
        count: response.data?.length || 0
      },
    });
  } catch (error) {
    return formatMittwaldToolResponse({
      status: "error",
      message: `Failed to get conversation members: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error,
      },
    });
  }
};