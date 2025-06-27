import type { 
  MittwaldToolHandler, 
  ConversationListArgs
} from '../../../../types/mittwald/conversation.js';
import { formatMittwaldToolResponse } from '../../../../types/mittwald/conversation.js';
export const handleMittwaldConversationList: MittwaldToolHandler<ConversationListArgs> = async (args, { mittwaldClient }) => {
  try {
    const { sort, order } = args;

    const response = await mittwaldClient.api.conversation.listConversations({
      queryParameters: {
        ...(sort && { sort }),
        ...(order && { order })
      }
    });

    if (response.status !== 200) {
      throw new Error(`API returned status ${response.status}`);
    }

    return formatMittwaldToolResponse({
      message: "Successfully retrieved conversations list",
      result: {
        conversations: response.data,
        count: response.data?.length || 0
      },
    });
  } catch (error) {
    return formatMittwaldToolResponse({
      status: "error",
      message: `Failed to list conversations: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error,
      },
    });
  }
};