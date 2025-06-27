import type { 
  MittwaldToolHandler, 
  ConversationFileUploadRequestArgs
} from '../../../../types/mittwald/conversation.js';
import { formatMittwaldToolResponse } from '../../../../types/mittwald/conversation.js';

export const handleMittwaldConversationFileUploadRequest: MittwaldToolHandler<ConversationFileUploadRequestArgs> = async (args, { mittwaldClient }) => {
  try {
    const { conversationId } = args;

    if (!conversationId) {
      throw new Error("conversationId is required");
    }

    const response = await mittwaldClient.api.conversation.requestFileUpload({
      conversationId
    });

    if (response.status !== 201) {
      throw new Error(`API returned status ${response.status}`);
    }

    return formatMittwaldToolResponse({
      message: "Successfully requested file upload token",
      result: {
        uploadToken: response.data
      },
    });
  } catch (error) {
    return formatMittwaldToolResponse({
      status: "error",
      message: `Failed to request file upload token: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error,
      },
    });
  }
};