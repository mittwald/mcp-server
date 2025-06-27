/**
 * @file Tool definitions for Mittwald User Email Management
 * @module constants/tool/mittwald/user/email
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';

/**
 * Tool for getting current email address
 */
export const mittwald_user_get_email: Tool = {
  name: "mittwald_user_get_email",
  description: "Get the current user's email address and verification status.",
  inputSchema: {
    type: "object",
    properties: {},
    required: []
  }
};

/**
 * Tool for changing email address
 */
export const mittwald_user_change_email: Tool = {
  name: "mittwald_user_change_email",
  description: "Change the current user's email address. Requires password confirmation and will send a verification email to the new address.",
  inputSchema: {
    type: "object",
    properties: {
      email: {
        type: "string",
        description: "The new email address",
        format: "email"
      },
      password: {
        type: "string",
        description: "Current password to confirm the change"
      }
    },
    required: ["email", "password"]
  }
};

/**
 * Tool for verifying email address
 */
export const mittwald_user_verify_email: Tool = {
  name: "mittwald_user_verify_email",
  description: "Verify the email address using the verification token sent to the email.",
  inputSchema: {
    type: "object",
    properties: {
      token: {
        type: "string",
        description: "The verification token from the email"
      }
    },
    required: ["token"]
  }
};

/**
 * Tool for resending verification email
 */
export const mittwald_user_resend_verification_email: Tool = {
  name: "mittwald_user_resend_verification_email",
  description: "Resend the email verification link to the current email address.",
  inputSchema: {
    type: "object",
    properties: {},
    required: []
  }
};

/**
 * Success messages
 */
export const emailMessages = {
  getSuccess: "Successfully retrieved email information.",
  changeSuccess: "Email change initiated. Please check your new email address for verification.",
  verifySuccess: "Email address successfully verified.",
  resendSuccess: "Verification email has been resent. Please check your inbox."
};