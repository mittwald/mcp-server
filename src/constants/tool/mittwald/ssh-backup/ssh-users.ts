/**
 * @file Tool definitions for Mittwald SSH Users API
 * @module constants/tool/mittwald/ssh-backup/ssh-users
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwaldListSshUsers: Tool = {
  name: "mittwald_list_ssh_users",
  description: "List all SSH users for a specific project. Returns SSH users with their usernames, status, and associated public keys.",
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

export const mittwaldCreateSshUser: Tool = {
  name: "mittwald_create_ssh_user",
  description: "Create a new SSH user within a project. The user can be used for SSH access to the project's servers.",
  inputSchema: {
    type: "object",
    properties: {
      projectId: {
        type: "string",
        description: "The unique identifier of the project",
      },
      username: {
        type: "string",
        description: "The username for the SSH user",
      },
      description: {
        type: "string",
        description: "Optional description for the SSH user",
      },
      publicKeys: {
        type: "array",
        items: {
          type: "string",
        },
        description: "Array of SSH public key IDs to associate with this user",
      },
    },
    required: ["projectId", "username"],
  },
};

export const mittwaldGetSshUser: Tool = {
  name: "mittwald_get_ssh_user",
  description: "Get details of a specific SSH user by its ID. Returns the user's configuration, status, and associated keys.",
  inputSchema: {
    type: "object",
    properties: {
      sshUserId: {
        type: "string",
        description: "The unique identifier of the SSH user",
      },
    },
    required: ["sshUserId"],
  },
};

export const mittwaldUpdateSshUser: Tool = {
  name: "mittwald_update_ssh_user",
  description: "Update an existing SSH user's properties such as description, public keys, or status.",
  inputSchema: {
    type: "object",
    properties: {
      sshUserId: {
        type: "string",
        description: "The unique identifier of the SSH user",
      },
      description: {
        type: "string",
        description: "New description for the SSH user",
      },
      publicKeys: {
        type: "array",
        items: {
          type: "string",
        },
        description: "Array of SSH public key IDs to associate with this user",
      },
      status: {
        type: "string",
        enum: ["active", "inactive"],
        description: "Status of the SSH user",
      },
    },
    required: ["sshUserId"],
  },
};

export const mittwaldDeleteSshUser: Tool = {
  name: "mittwald_delete_ssh_user",
  description: "Delete an SSH user. This will permanently remove the user and revoke SSH access.",
  inputSchema: {
    type: "object",
    properties: {
      sshUserId: {
        type: "string",
        description: "The unique identifier of the SSH user to delete",
      },
    },
    required: ["sshUserId"],
  },
};