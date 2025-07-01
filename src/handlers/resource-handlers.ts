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
import { getResourceContent } from '../resources/index.js';



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

    // Check if resource exists
    const resource = RESOURCES.find(r => r.uri === uri);
    if (!resource) {
      throw new Error(RESOURCE_ERROR_MESSAGES.INVALID_URI(uri));
    }

    // Get content using the resource content handler
    const content = await getResourceContent(uri);

    return {
      contents: [
        {
          uri: request.params.uri,
          mimeType: resource.mimeType,
          text: content,
        },
      ],
    };
  } catch (error) {
    throw new Error(RESOURCE_ERROR_MESSAGES.FETCH_FAILED(error));
  }
}
