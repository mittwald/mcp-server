/**
 * @file Tool definitions for Mittwald User Password Management
 * @module constants/tool/mittwald/user/password
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';

/**
 * Tool for changing password
 */
export const mittwald_user_change_password: Tool = {
  name: "mittwald_user_change_password",
  description: "Change the current user's password. Requires the current password for verification.",
  inputSchema: {
    type: "object",
    properties: {
      oldPassword: {
        type: "string",
        description: "The current password"
      },
      newPassword: {
        type: "string",
        description: "The new password"
      }
    },
    required: ["oldPassword", "newPassword"]
  }
};

/**
 * Tool for getting password last updated timestamp
 */
export const mittwald_user_get_password_updated_at: Tool = {
  name: "mittwald_user_get_password_updated_at",
  description: "Get the timestamp when the password was last updated.",
  inputSchema: {
    type: "object",
    properties: {},
    required: []
  }
};

/**
 * Tool for initiating password reset
 */
export const mittwald_user_init_password_reset: Tool = {
  name: "mittwald_user_init_password_reset",
  description: "Initiate a password reset process by sending a reset link to the user's email address.",
  inputSchema: {
    type: "object",
    properties: {
      email: {
        type: "string",
        description: "The email address associated with the account",
        format: "email"
      }
    },
    required: ["email"]
  }
};

/**
 * Tool for confirming password reset
 */
export const mittwald_user_confirm_password_reset: Tool = {
  name: "mittwald_user_confirm_password_reset",
  description: "Complete the password reset process using the token from the reset email.",
  inputSchema: {
    type: "object",
    properties: {
      token: {
        type: "string",
        description: "The password reset token from the email"
      },
      password: {
        type: "string",
        description: "The new password"
      }
    },
    required: ["token", "password"]
  }
};

/**
 * Success messages
 */
export const passwordMessages = {
  changeSuccess: "Password successfully changed.",
  getUpdatedAtSuccess: "Successfully retrieved password update timestamp.",
  initResetSuccess: "Password reset email has been sent. Please check your inbox.",
  confirmResetSuccess: "Password has been successfully reset. You can now log in with your new password."
};