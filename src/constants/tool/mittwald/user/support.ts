/**
 * @file Tool definitions for Mittwald User Support & Feedback
 * @module constants/tool/mittwald/user/support
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_user_create_feedback: Tool = {
  name: "mittwald_user_create_feedback",
  description: "Submit feedback to Mittwald",
  inputSchema: {
    type: "object",
    properties: {
      subject: { type: "string", description: "Feedback subject" },
      message: { type: "string", description: "Feedback message" },
      type: { type: "string", enum: ["bug", "feature", "improvement", "other"] }
    },
    required: ["subject", "message"]
  }
};

export const mittwald_user_get_feedback: Tool = {
  name: "mittwald_user_get_feedback",
  description: "Get user's submitted feedback",
  inputSchema: {
    type: "object",
    properties: { userId: { type: "string", description: "User ID" } },
    required: ["userId"]
  }
};

export const mittwald_user_create_issue: Tool = {
  name: "mittwald_user_create_issue",
  description: "Create a support issue",
  inputSchema: {
    type: "object",
    properties: {
      subject: { type: "string", description: "Issue subject" },
      message: { type: "string", description: "Issue description" },
      type: { type: "string", enum: ["technical", "billing", "general"] },
      priority: { type: "string", enum: ["low", "medium", "high", "urgent"] }
    },
    required: ["subject", "message", "type"]
  }
};

export const mittwald_user_get_support_code: Tool = {
  name: "mittwald_user_get_support_code",
  description: "Get support code for customer service",
  inputSchema: { type: "object", properties: {}, required: [] }
};