/**
 * @file Tool definitions for Mittwald User Session Management
 * @module constants/tool/mittwald/user/session
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';

/**
 * Tool for listing user sessions
 */
export const mittwald_user_list_sessions: Tool = {
  name: "mittwald_user_list_sessions",
  description: "List all active sessions for the current user. Shows details about each session including creation time, last access, and device information.",
  inputSchema: {
    type: "object",
    properties: {},
    required: []
  }
};

/**
 * Tool for getting a specific session
 */
export const mittwald_user_get_session: Tool = {
  name: "mittwald_user_get_session",
  description: "Get detailed information about a specific session by its token ID.",
  inputSchema: {
    type: "object",
    properties: {
      tokenId: {
        type: "string",
        description: "The ID of the session token to retrieve"
      }
    },
    required: ["tokenId"]
  }
};

/**
 * Tool for refreshing all sessions
 */
export const mittwald_user_refresh_sessions: Tool = {
  name: "mittwald_user_refresh_sessions",
  description: "Refresh the expiration time of all active sessions for the current user.",
  inputSchema: {
    type: "object",
    properties: {},
    required: []
  }
};

/**
 * Tool for terminating a specific session
 */
export const mittwald_user_terminate_session: Tool = {
  name: "mittwald_user_terminate_session",
  description: "Terminate a specific session by its token ID. This will log out the session on that device.",
  inputSchema: {
    type: "object",
    properties: {
      tokenId: {
        type: "string",
        description: "The ID of the session token to terminate"
      }
    },
    required: ["tokenId"]
  }
};

/**
 * Tool for terminating all sessions
 */
export const mittwald_user_terminate_all_sessions: Tool = {
  name: "mittwald_user_terminate_all_sessions",
  description: "Terminate all active sessions for the current user. This will log out all devices except the current one.",
  inputSchema: {
    type: "object",
    properties: {
      includeCurrentSession: {
        type: "boolean",
        description: "Whether to also terminate the current session (default: false)"
      }
    },
    required: []
  }
};

/**
 * Success messages
 */
export const sessionMessages = {
  listSuccess: "Successfully retrieved user sessions.",
  getSuccess: "Successfully retrieved session details.",
  refreshSuccess: "Successfully refreshed all sessions.",
  terminateSuccess: "Successfully terminated the session.",
  terminateAllSuccess: "Successfully terminated all sessions."
};