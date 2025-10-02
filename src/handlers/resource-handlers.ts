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

    const accessToken = extra?.authInfo?.token;
    if (!accessToken) {
      throw new Error('Authentication required to access this resource');
    }

    const content = await getResourceContent(uri, accessToken);

    const resource = RESOURCES.find(r => r.uri === uri);

    let mimeType = resource?.mimeType ?? 'text/plain';
    if (!resource) {
      if (/^mittwald:\/\/ddev\/config\//i.test(uri)) {
        mimeType = 'application/x-yaml';
      } else if (/^mittwald:\/\/ddev\/setup-instructions\//i.test(uri)) {
        mimeType = 'text/markdown';
      }
    }

    return {
      contents: [
        {
          uri: request.params.uri,
          mimeType,
          text: content,
        },
      ],
    };
  } catch (error) {
    throw new Error(RESOURCE_ERROR_MESSAGES.FETCH_FAILED(error));
  }
}
