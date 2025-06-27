/**
 * @file Tool definitions for Mittwald SFTP Users API
 * @module constants/tool/mittwald/ssh-backup/sftp-users
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwaldListSftpUsers: Tool = {
  name: "mittwald_list_sftp_users",
  description: "List all SFTP users for a specific project. Returns SFTP users with their usernames, status, and home directories.",
  inputSchema: {
    type: "object",
    properties: {
      projectId: {
        type: "string",
        description: "The unique identifier of the project",
      },
    },
    required: ["projectId"],
  },
};

export const mittwaldCreateSftpUser: Tool = {
  name: "mittwald_create_sftp_user",
  description: "Create a new SFTP user within a project. The user can be used for SFTP access to the project's file system.",
  inputSchema: {
    type: "object",
    properties: {
      projectId: {
        type: "string",
        description: "The unique identifier of the project",
      },
      username: {
        type: "string",
        description: "The username for the SFTP user",
      },
      description: {
        type: "string",
        description: "Optional description for the SFTP user",
      },
      password: {
        type: "string",
        description: "Password for the SFTP user (if not provided, one will be generated)",
      },
    },
    required: ["projectId", "username"],
  },
};

export const mittwaldGetSftpUser: Tool = {
  name: "mittwald_get_sftp_user",
  description: "Get details of a specific SFTP user by its ID. Returns the user's configuration, status, and home directory.",
  inputSchema: {
    type: "object",
    properties: {
      sftpUserId: {
        type: "string",
        description: "The unique identifier of the SFTP user",
      },
    },
    required: ["sftpUserId"],
  },
};

export const mittwaldUpdateSftpUser: Tool = {
  name: "mittwald_update_sftp_user",
  description: "Update an existing SFTP user's properties such as description, password, or status.",
  inputSchema: {
    type: "object",
    properties: {
      sftpUserId: {
        type: "string",
        description: "The unique identifier of the SFTP user",
      },
      description: {
        type: "string",
        description: "New description for the SFTP user",
      },
      password: {
        type: "string",
        description: "New password for the SFTP user",
      },
      status: {
        type: "string",
        enum: ["active", "inactive"],
        description: "Status of the SFTP user",
      },
    },
    required: ["sftpUserId"],
  },
};

export const mittwaldDeleteSftpUser: Tool = {
  name: "mittwald_delete_sftp_user",
  description: "Delete an SFTP user. This will permanently remove the user and revoke SFTP access.",
  inputSchema: {
    type: "object",
    properties: {
      sftpUserId: {
        type: "string",
        description: "The unique identifier of the SFTP user to delete",
      },
    },
    required: ["sftpUserId"],
  },
};