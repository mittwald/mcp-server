import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwaldNotificationMarkRead: Tool = {
  name: "mittwald_notification_mark_read",
  description: "Mark a specific notification as read by its ID.",
  inputSchema: {
    type: "object",
    properties: {
      notificationId: {
        type: "string",
        description: "ID of the notification to mark as read"
      }
    },
    required: ["notificationId"]
  },
  _meta: {
    title: "Mark Notification Read",
    type: "server",
  },
};