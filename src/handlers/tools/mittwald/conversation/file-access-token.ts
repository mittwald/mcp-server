import type { 
  MittwaldToolHandler, 
  ConversationFileAccessTokenArgs
} from '../../../../types/mittwald/conversation.js';
import { formatMittwaldToolResponse } from '../../../../types/mittwald/conversation.js';

export const handleMittwaldConversationFileAccessToken: MittwaldToolHandler<ConversationFileAccessTokenArgs> = async (args, { mittwaldClient }) => {
  try {
    const { conversationId, fileId } = args;

    if (!conversationId) {
      throw new Error("conversationId is required");
    }

    if (!fileId) {
      throw new Error("fileId is required");
    }

    const response = await mittwaldClient.api.conversation.getFileAccessToken({
      conversationId,
      fileId
    });

    if (response.status !== 200) {
      throw new Error(`API returned status ${response.status}`);
    }

    return formatMittwaldToolResponse({
      message: "Successfully retrieved file access token",
      result: {
        accessToken: response.data
      },
    });
  } catch (error) {
    return formatMittwaldToolResponse({
      status: "error",
      message: `Failed to get file access token: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error,
      },
    });
  }
};