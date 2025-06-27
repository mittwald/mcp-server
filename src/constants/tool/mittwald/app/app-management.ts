import type { Tool } from '@modelcontextprotocol/sdk/types.js';

/**
 * Tool definitions for App management operations
 * 
 * @module
 * This module contains tool definitions for listing and retrieving apps
 */

export const mittwald_app_list: Tool = {
  name: "mittwald_app_list",
  description: "List all available apps that can be installed. Returns a list of apps with their IDs, names, tags, and supported actions.",
  inputSchema: {
    type: "object",
    properties: {
      limit: {
        type: "number",
        description: "Maximum number of apps to return",
        default: 100
      },
      skip: {
        type: "number", 
        description: "Number of apps to skip (for pagination)",
        default: 0
      }
    },
    required: []
  },
  _meta: {
    hidden: false,
    title: "List Mittwald Apps",
    type: "server"
  }
};

export const mittwald_app_get: Tool = {
  name: "mittwald_app_get",
  description: "Get detailed information about a specific app by its ID. Returns app details including supported versions, actions, and metadata.",
  inputSchema: {
    type: "object",
    properties: {
      appId: {
        type: "string",
        description: "The UUID of the app to retrieve"
      }
    },
    required: ["appId"]
  },
  _meta: {
    hidden: false,
    title: "Get Mittwald App Details",
    type: "server"
  }
};

export const mittwald_app_listSuccessMessage = "Successfully retrieved app list";
export const mittwald_app_getSuccessMessage = "Successfully retrieved app details";