import type { 
  MittwaldToolHandler, 
  ConversationStatusSetArgs
} from '../../../../types/mittwald/conversation.js';
import { formatMittwaldToolResponse } from '../../../../types/mittwald/conversation.js';

export const handleMittwaldConversationStatusSet: MittwaldToolHandler<ConversationStatusSetArgs> = async (args, { mittwaldClient }) => {
  try {
    const { conversationId, status } = args;

    if (!conversationId) {
      throw new Error("conversationId is required");
    }

    if (!status) {
      throw new Error("status is required");
    }

    if (!["open", "answered", "closed"].includes(status)) {
      throw new Error("status must be one of: open, answered, closed");
    }

    const response = await mittwaldClient.api.conversation.setConversationStatus({
      conversationId,
      data: { status }
    });

    if (response.status !== 200) {
      throw new Error(`API returned status ${response.status}`);
    }

    return formatMittwaldToolResponse({
      message: `Successfully set conversation status to '${status}'`,
      result: {
        conversationId,
        status,
        updated: true
      },
    });
  } catch (error) {
    return formatMittwaldToolResponse({
      status: "error",
      message: `Failed to set conversation status: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error,
      },
    });
  }
};