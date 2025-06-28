import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwaldMailDeliveryboxList: Tool = {
  name: "mittwald_mail_deliverybox_list",
  description: "Get all delivery boxes by project ID.",
  inputSchema: {
    type: "object",
    properties: {
      output: {
        type: "string",
        enum: ["txt", "json", "yaml", "csv", "tsv"],
        description: "Output format (default: txt)"
      },
      projectId: {
        type: "string",
        description: "ID or short ID of a project (optional if default project is set)"
      },
      extended: {
        type: "boolean",
        description: "Show extended information"
      },
      noHeader: {
        type: "boolean",
        description: "Hide table header"
      },
      noTruncate: {
        type: "boolean",
        description: "Do not truncate output"
      },
      noRelativeDates: {
        type: "boolean",
        description: "Show dates in absolute format"
      },
      csvSeparator: {
        type: "string",
        enum: [",", ";"],
        description: "Separator for CSV output"
      }
    },
    required: ["output"]
  }
};