/**
 * @file Tool definitions for Mittwald User MFA Management
 * @module constants/tool/mittwald/user/mfa
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_user_get_mfa_status: Tool = {
  name: "mittwald_user_get_mfa_status",
  description: "Get MFA status and configuration",
  inputSchema: { type: "object", properties: {}, required: [] }
};

export const mittwald_user_init_mfa: Tool = {
  name: "mittwald_user_init_mfa",
  description: "Initialize MFA setup",
  inputSchema: {
    type: "object",
    properties: { type: { type: "string", enum: ["totp", "sms"] } },
    required: ["type"]
  }
};

export const mittwald_user_confirm_mfa: Tool = {
  name: "mittwald_user_confirm_mfa",
  description: "Confirm MFA setup",
  inputSchema: {
    type: "object",
    properties: {
      multiFactorCode: { type: "string", description: "6-digit MFA code" },
      recoveryCodes: { type: "array", items: { type: "string" } }
    },
    required: ["multiFactorCode"]
  }
};

export const mittwald_user_disable_mfa: Tool = {
  name: "mittwald_user_disable_mfa",
  description: "Disable MFA",
  inputSchema: {
    type: "object",
    properties: { password: { type: "string", description: "Current password" } },
    required: ["password"]
  }
};

export const mittwald_user_update_mfa: Tool = {
  name: "mittwald_user_update_mfa",
  description: "Update MFA settings",
  inputSchema: {
    type: "object",
    properties: {
      type: { type: "string", enum: ["totp", "sms"] },
      enabled: { type: "boolean" }
    },
    required: []
  }
};