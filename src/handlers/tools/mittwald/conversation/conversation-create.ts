import type { 
  MittwaldToolHandler, 
  ConversationCreateArgs
} from '../../../../types/mittwald/conversation.js';
import { formatMittwaldToolResponse } from "../../../../types/mittwald/conversation.js";import { formatMittwaldToolResponse } from '../../../../types/mittwald/conversation.js';
import { formatMittwaldToolResponse } from "../../../../types/mittwald/conversation.js";
export const handleMittwaldConversationCreate: MittwaldToolHandler<ConversationCreateArgs> = async (args, { mittwaldClient }) => {
  try {
    const { categoryId, mainUserId, notificationRoles, relatedTo, sharedWith, title } = args;

    const response = await mittwaldClient.api.conversation.createConversation({
      data: {
        categoryId,
        mainUserId,
        notificationRoles,
        relatedTo,
        sharedWith,
        title
      }
    });

    if (response.status !== 201) {
      throw new Error(`API returned status ${response.status}`);
    }

    return formatMittwaldToolResponse({
      message: "Successfully created conversation",
      result: {
        conversation: response.data
      },
    });
  } catch (error) {
    return formatMittwaldToolResponse({
      status: "error",
      message: `Failed to create conversation: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error,
      },
    });
  }
};