import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwaldNotificationUnreadCounts: Tool = {
  name: "mittwald_notification_unread_counts",
  description: "Get counts of unread notifications by severity level (success, info, warning, error) for the authenticated user. This is a lightweight alternative to fetching all notifications.",
  inputSchema: {
    type: "object",
    properties: {}
  },
  _meta: {
    title: "Get Unread Notification Counts",
    type: "server",
  },
};