import type { Tool } from '@modelcontextprotocol/sdk/types.js';

/**
 * Tool definitions for App version operations
 * 
 * @module
 * This module contains tool definitions for managing app versions
 */

export const mittwald_app_list_versions: Tool = {
  name: "mittwald_app_list_versions",
  description: "List all available versions for a specific app. Returns version details including external version numbers, recommended versions, and dependencies.",
  inputSchema: {
    type: "object",
    properties: {
      appId: {
        type: "string",
        description: "The UUID of the app to list versions for"
      },
      recommended: {
        type: "boolean",
        description: "Filter to only show recommended versions",
        default: false
      }
    },
    required: ["appId"]
  },
  _meta: {
    hidden: false,
    title: "List App Versions",
    type: "server"
  }
};

export const mittwald_app_get_version: Tool = {
  name: "mittwald_app_get_version",
  description: "Get detailed information about a specific app version. Returns complete version details including dependencies, user inputs, and configuration options.",
  inputSchema: {
    type: "object",
    properties: {
      appId: {
        type: "string",
        description: "The UUID of the app"
      },
      appVersionId: {
        type: "string",
        description: "The UUID of the app version to retrieve"
      }
    },
    required: ["appId", "appVersionId"]
  },
  _meta: {
    hidden: false,
    title: "Get App Version Details",
    type: "server"
  }
};

export const mittwald_app_get_version_update_candidates: Tool = {
  name: "mittwald_app_get_version_update_candidates",
  description: "Get available update candidates for a specific app version. Returns a list of versions that the specified version can be updated to, considering breaking changes and compatibility.",
  inputSchema: {
    type: "object",
    properties: {
      appId: {
        type: "string",
        description: "The UUID of the app"
      },
      baseAppVersionId: {
        type: "string",
        description: "The UUID of the current app version to find updates for"
      }
    },
    required: ["appId", "baseAppVersionId"]
  },
  _meta: {
    hidden: false,
    title: "Get App Version Update Candidates",
    type: "server"
  }
};

export const mittwald_app_list_versionsSuccessMessage = "Successfully retrieved app versions";
export const mittwald_app_get_versionSuccessMessage = "Successfully retrieved app version details";
export const mittwald_app_get_version_update_candidatesSuccessMessage = "Successfully retrieved update candidates";