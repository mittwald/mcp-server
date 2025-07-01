import type { AuthInfo } from '@modelcontextprotocol/sdk/server/auth/types.js';
import type {
  ListResourcesResult,
  ReadResourceRequest,
  ReadResourceResult,
} from '@modelcontextprotocol/sdk/types.js';
import { 
  RESOURCES, 
  RESOURCE_ERROR_MESSAGES
} from '../constants/resources.js';
import { containerComprehensiveGuideContent } from '../resources/container-comprehensive-guide.js';



export async function handleListResources(): Promise<ListResourcesResult> {
  try {
    return { resources: [...RESOURCES] };
  } catch (error) {
    throw new Error(RESOURCE_ERROR_MESSAGES.LIST_FAILED(error));
  }
}

export async function handleResourceCall(
  request: ReadResourceRequest,
  extra?: { authInfo?: AuthInfo },
): Promise<ReadResourceResult> {
  try {
    const { uri } = request.params;

    if (uri === "mittwald://container-comprehensive-guide") {
      return {
        contents: [
          {
            uri: request.params.uri,
            mimeType: "text/markdown",
            text: containerComprehensiveGuideContent,
          },
        ],
      };
    }


    throw new Error(RESOURCE_ERROR_MESSAGES.INVALID_URI(uri));
  } catch (error) {
    throw new Error(RESOURCE_ERROR_MESSAGES.FETCH_FAILED(error));
  }
}
