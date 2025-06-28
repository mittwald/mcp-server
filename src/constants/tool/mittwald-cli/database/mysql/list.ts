import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_database_mysql_list: Tool = {
  name: "mittwald_database_mysql_list",
  description: "List MySQL databases",
  inputSchema: {
    type: "object",
    properties: {
      projectId: {
        type: "string",
        description: "ID or short ID of a project",
      },
      output: {
        type: "string",
        enum: ["txt", "json", "yaml", "csv", "tsv"],
        description: "Output format",
        default: "txt",
      },
      extended: {
        type: "boolean",
        description: "Show extended information",
      },
      noHeader: {
        type: "boolean",
        description: "Hide table header",
      },
      noTruncate: {
        type: "boolean",
        description: "Do not truncate output",
      },
      noRelativeDates: {
        type: "boolean",
        description: "Show dates in absolute format",
      },
      csvSeparator: {
        type: "string",
        enum: [",", ";"],
        description: "Separator for CSV output",
      },
    },
    required: [],
  },
};