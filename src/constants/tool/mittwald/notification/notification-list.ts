import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwaldNotificationList: Tool = {
  name: "mittwald_notification_list",
  description: "List all unread notifications for the authenticated user with optional filtering and pagination.",
  inputSchema: {
    type: "object",
    properties: {
      status: {
        type: "string",
        description: "Filter by notification status"
      },
      limit: {
        type: "number",
        description: "Maximum number of notifications to return"
      },
      skip: {
        type: "number", 
        description: "Number of notifications to skip (for pagination)"
      },
      page: {
        type: "number",
        description: "Page number to display (alternative to skip)"
      }
    }
  },
  _meta: {
    title: "List Notifications",
    type: "server",
  },
};