/**
 * @file Tool definitions for Mittwald SSH Keys API
 * @module constants/tool/mittwald/ssh-backup/ssh-keys
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwaldListSshKeys: Tool = {
  name: "mittwald_list_ssh_keys",
  description: "List all SSH keys for the authenticated user. Returns user's SSH keys with their labels, fingerprints, and metadata.",
  inputSchema: {
    type: "object",
    properties: {},
    required: [],
  },
};

export const mittwaldCreateSshKey: Tool = {
  name: "mittwald_create_ssh_key",
  description: "Create a new SSH key for the authenticated user. The SSH key can be used for authentication to projects and servers.",
  inputSchema: {
    type: "object",
    properties: {
      label: {
        type: "string",
        description: "A descriptive label for the SSH key",
      },
      publicKey: {
        type: "string", 
        description: "The public key content (OpenSSH format)",
      },
      expiresAt: {
        type: "string",
        format: "date-time",
        description: "Optional expiration date for the SSH key (ISO 8601 format)",
      },
    },
    required: ["label", "publicKey"],
  },
};

export const mittwaldGetSshKey: Tool = {
  name: "mittwald_get_ssh_key",
  description: "Get details of a specific SSH key by its ID. Returns the key's metadata including label, fingerprint, and expiration.",
  inputSchema: {
    type: "object",
    properties: {
      sshKeyId: {
        type: "string",
        description: "The unique identifier of the SSH key",
      },
    },
    required: ["sshKeyId"],
  },
};

export const mittwaldUpdateSshKey: Tool = {
  name: "mittwald_update_ssh_key",
  description: "Update an existing SSH key's properties such as label or expiration date.",
  inputSchema: {
    type: "object",
    properties: {
      sshKeyId: {
        type: "string",
        description: "The unique identifier of the SSH key",
      },
      label: {
        type: "string",
        description: "New label for the SSH key",
      },
      expiresAt: {
        type: "string",
        format: "date-time", 
        description: "New expiration date for the SSH key (ISO 8601 format)",
      },
    },
    required: ["sshKeyId"],
  },
};

export const mittwaldDeleteSshKey: Tool = {
  name: "mittwald_delete_ssh_key",
  description: "Delete an SSH key. This will permanently remove the key and revoke access to any resources using this key.",
  inputSchema: {
    type: "object",
    properties: {
      sshKeyId: {
        type: "string",
        description: "The unique identifier of the SSH key to delete",
      },
    },
    required: ["sshKeyId"],
  },
};