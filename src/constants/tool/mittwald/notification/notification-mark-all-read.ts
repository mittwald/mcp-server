import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwaldNotificationMarkAllRead: Tool = {
  name: "mittwald_notification_mark_all_read",
  description: "Mark all notifications as read for the authenticated user. Supports optional filtering by severity, reference ID, aggregate, or domain.",
  inputSchema: {
    type: "object",
    properties: {
      severities: {
        type: "array",
        items: {
          type: "string",
          enum: ["success", "info", "warning", "error"]
        },
        description: "Filter by notification severities"
      },
      referenceId: {
        type: "string",
        description: "Filter by reference ID"
      },
      referenceAggregate: {
        type: "string", 
        description: "Filter by reference aggregate"
      },
      referenceDomain: {
        type: "string",
        description: "Filter by reference domain"
      }
    }
  },
  _meta: {
    title: "Mark All Notifications Read",
    type: "server",
  },
};