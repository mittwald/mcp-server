/**
 * @file Handler implementations for Mittwald User API Token Management tools
 * @module handlers/tools/mittwald/user/api-tokens
 */

import { getMittwaldClient } from '../../../../services/mittwald/index.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { ApiToken, CreateApiTokenRequest } from '../../../../types/mittwald/user.js';
import { apiTokenMessages } from '../../../../constants/tool/mittwald/user/api-tokens.js';

/**
 * Format tool response
 */
function formatResponse(data: any, message?: string): CallToolResult {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({
          status: "success",
          message: message || "Operation completed successfully",
          result: data
        }, null, 2)
      }
    ]
  };
}

/**
 * Format error response
 */
function formatErrorResponse(error: any): CallToolResult {
  const errorMessage = error?.response?.data?.message || error?.message || "Unknown error occurred";
  const errorCode = error?.response?.status || error?.code || "UNKNOWN_ERROR";
  
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({
          status: "error",
          message: `API token operation failed: ${errorMessage}`,
          error: {
            type: "API_TOKEN_ERROR",
            code: errorCode,
            details: error?.response?.data || {}
          }
        }, null, 2)
      }
    ]
  };
}

/**
 * Handler for listing API tokens
 */
export async function handleListApiTokens(): Promise<CallToolResult> {
  try {
    const client = getMittwaldClient();
    
    const response = await client.api.user.listApiTokens({});

    if (response.status === 200 && response.data) {
      const tokens = response.data as ApiToken[];
      
      return formatResponse({
        tokens: tokens.map(token => ({
          ...token,
          // Don't include the actual token value for security
          tokenValue: undefined
        })),
        count: tokens.length
      }, apiTokenMessages.listSuccess);
    }

    throw new Error("Failed to retrieve API tokens");
  } catch (error) {
    return formatErrorResponse(error);
  }
}

/**
 * Handler for getting a specific API token
 */
export async function handleGetApiToken(args: { apiTokenId: string }): Promise<CallToolResult> {
  try {
    const client = getMittwaldClient();
    
    const response = await client.api.user.getApiToken({
      apiTokenId: args.apiTokenId
    });

    if (response.status === 200 && response.data) {
      return formatResponse({
        token: {
          ...response.data,
          // Don't include the actual token value for security
          tokenValue: undefined
        }
      }, apiTokenMessages.getSuccess);
    }

    throw new Error("Failed to retrieve API token");
  } catch (error) {
    return formatErrorResponse(error);
  }
}

/**
 * Handler for creating an API token
 */
export async function handleCreateApiToken(args: CreateApiTokenRequest): Promise<CallToolResult> {
  try {
    const client = getMittwaldClient();
    
    const requestData: any = {
      name: args.name
    };
    
    if (args.description) requestData.description = args.description;
    if (args.expiresAt) requestData.expiresAt = args.expiresAt;
    if (args.scopes) requestData.scopes = args.scopes;
    
    const response = await client.api.user.createApiToken({
      data: requestData
    });

    if (response.status === 201 && response.data) {
      return formatResponse({
        token: response.data,
        warning: "Please save the token value securely. It will not be shown again."
      }, apiTokenMessages.createSuccess);
    }

    throw new Error("Failed to create API token");
  } catch (error) {
    return formatErrorResponse(error);
  }
}

/**
 * Handler for updating an API token
 */
export async function handleUpdateApiToken(args: { 
  apiTokenId: string; 
  name?: string; 
  description?: string 
}): Promise<CallToolResult> {
  try {
    const client = getMittwaldClient();
    
    const updateData: any = {};
    if (args.name !== undefined) updateData.name = args.name;
    if (args.description !== undefined) updateData.description = args.description;
    
    const response = await client.api.user.updateApiToken({
      apiTokenId: args.apiTokenId,
      data: updateData
    });

    if (response.status === 200 || response.status === 204) {
      // Get updated token data
      const tokenResponse = await client.api.user.getApiToken({
        apiTokenId: args.apiTokenId
      });
      
      return formatResponse({
        token: {
          ...tokenResponse.data,
          tokenValue: undefined
        },
        updated: true
      }, apiTokenMessages.updateSuccess);
    }

    throw new Error("Failed to update API token");
  } catch (error) {
    return formatErrorResponse(error);
  }
}

/**
 * Handler for deleting an API token
 */
export async function handleDeleteApiToken(args: { apiTokenId: string }): Promise<CallToolResult> {
  try {
    const client = getMittwaldClient();
    
    const response = await client.api.user.deleteApiToken({
      apiTokenId: args.apiTokenId
    });

    if (response.status === 204 || response.status === 200) {
      return formatResponse({
        deleted: true,
        apiTokenId: args.apiTokenId,
        message: "API token has been permanently deleted and is no longer valid."
      }, apiTokenMessages.deleteSuccess);
    }

    throw new Error("Failed to delete API token");
  } catch (error) {
    return formatErrorResponse(error);
  }
}