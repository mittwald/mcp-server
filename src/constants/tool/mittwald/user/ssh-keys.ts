/**
 * @file Tool definitions for Mittwald User SSH Key Management
 * @module constants/tool/mittwald/user/ssh-keys
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_user_list_ssh_keys: Tool = {
  name: "mittwald_user_list_ssh_keys",
  description: "List all SSH keys for the current user",
  inputSchema: { type: "object", properties: {}, required: [] }
};

export const mittwald_user_get_ssh_key: Tool = {
  name: "mittwald_user_get_ssh_key",
  description: "Get a specific SSH key by ID",
  inputSchema: {
    type: "object",
    properties: { sshKeyId: { type: "string", description: "SSH key ID" } },
    required: ["sshKeyId"]
  }
};

export const mittwald_user_create_ssh_key: Tool = {
  name: "mittwald_user_create_ssh_key",
  description: "Add a new SSH key",
  inputSchema: {
    type: "object",
    properties: {
      publicKey: { type: "string", description: "SSH public key" },
      comment: { type: "string", description: "Optional comment" }
    },
    required: ["publicKey"]
  }
};

export const mittwald_user_update_ssh_key: Tool = {
  name: "mittwald_user_update_ssh_key",
  description: "Update SSH key comment",
  inputSchema: {
    type: "object",
    properties: {
      sshKeyId: { type: "string", description: "SSH key ID" },
      comment: { type: "string", description: "New comment" }
    },
    required: ["sshKeyId", "comment"]
  }
};

export const mittwald_user_delete_ssh_key: Tool = {
  name: "mittwald_user_delete_ssh_key",
  description: "Delete an SSH key",
  inputSchema: {
    type: "object",
    properties: { sshKeyId: { type: "string", description: "SSH key ID" } },
    required: ["sshKeyId"]
  }
};