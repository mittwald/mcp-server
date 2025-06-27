/**
 * @file Tool definitions for Mittwald User Phone Management
 * @module constants/tool/mittwald/user/phone
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_user_add_phone: Tool = {
  name: "mittwald_user_add_phone",
  description: "Add phone number to user account",
  inputSchema: {
    type: "object",
    properties: {
      userId: { type: "string", description: "User ID" },
      phoneNumber: { type: "string", description: "Phone number" },
      primary: { type: "boolean", description: "Set as primary" }
    },
    required: ["userId", "phoneNumber"]
  }
};

export const mittwald_user_verify_phone: Tool = {
  name: "mittwald_user_verify_phone",
  description: "Verify phone number with code",
  inputSchema: {
    type: "object",
    properties: {
      userId: { type: "string", description: "User ID" },
      verificationCode: { type: "string", description: "Verification code" }
    },
    required: ["userId", "verificationCode"]
  }
};

export const mittwald_user_remove_phone: Tool = {
  name: "mittwald_user_remove_phone",
  description: "Remove phone number from account",
  inputSchema: {
    type: "object",
    properties: { userId: { type: "string", description: "User ID" } },
    required: ["userId"]
  }
};