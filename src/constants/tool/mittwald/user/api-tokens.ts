/**
 * @file Tool definitions for Mittwald User API Token Management
 * @module constants/tool/mittwald/user/api-tokens
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';

/**
 * Tool for listing API tokens
 */
export const mittwald_user_list_api_tokens: Tool = {
  name: "mittwald_user_list_api_tokens",
  description: "List all API tokens for the current user including their names, creation dates, and last usage.",
  inputSchema: {
    type: "object",
    properties: {},
    required: []
  }
};

/**
 * Tool for getting a specific API token
 */
export const mittwald_user_get_api_token: Tool = {
  name: "mittwald_user_get_api_token",
  description: "Get detailed information about a specific API token by its ID.",
  inputSchema: {
    type: "object",
    properties: {
      apiTokenId: {
        type: "string",
        description: "The ID of the API token to retrieve"
      }
    },
    required: ["apiTokenId"]
  }
};

/**
 * Tool for creating an API token
 */
export const mittwald_user_create_api_token: Tool = {
  name: "mittwald_user_create_api_token",
  description: "Create a new API token with specified name, description, and optional expiration date.",
  inputSchema: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "A descriptive name for the API token"
      },
      description: {
        type: "string",
        description: "Optional description of what this token is used for"
      },
      expiresAt: {
        type: "string",
        description: "Optional expiration date in ISO 8601 format (e.g., 2024-12-31T23:59:59Z)"
      },
      scopes: {
        type: "array",
        items: {
          type: "string"
        },
        description: "Optional array of scopes to limit token permissions"
      }
    },
    required: ["name"]
  }
};

/**
 * Tool for updating an API token
 */
export const mittwald_user_update_api_token: Tool = {
  name: "mittwald_user_update_api_token",
  description: "Update an existing API token's name or description.",
  inputSchema: {
    type: "object",
    properties: {
      apiTokenId: {
        type: "string",
        description: "The ID of the API token to update"
      },
      name: {
        type: "string",
        description: "New name for the API token"
      },
      description: {
        type: "string",
        description: "New description for the API token"
      }
    },
    required: ["apiTokenId"]
  }
};

/**
 * Tool for deleting an API token
 */
export const mittwald_user_delete_api_token: Tool = {
  name: "mittwald_user_delete_api_token",
  description: "Delete an API token. This action is irreversible and will immediately invalidate the token.",
  inputSchema: {
    type: "object",
    properties: {
      apiTokenId: {
        type: "string",
        description: "The ID of the API token to delete"
      }
    },
    required: ["apiTokenId"]
  }
};

/**
 * Success messages
 */
export const apiTokenMessages = {
  listSuccess: "Successfully retrieved API tokens.",
  getSuccess: "Successfully retrieved API token details.",
  createSuccess: "API token created successfully. Please save the token value as it won't be shown again.",
  updateSuccess: "API token updated successfully.",
  deleteSuccess: "API token deleted successfully."
};