import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_app_dependency_list: Tool = {
  name: "mittwald_app_dependency_list",
  description: "Get all available dependencies",
  inputSchema: {
    type: "object",
    properties: {
      output: {
        type: "string",
        description: "Output format",
        enum: ["txt", "json", "yaml", "csv", "tsv"],
        default: "txt"
      },
      extended: {
        type: "boolean",
        description: "Show extended information"
      },
      csvSeparator: {
        type: "string",
        description: "Separator for CSV output",
        enum: [",", ";"],
        default: ","
      },
      noHeader: {
        type: "boolean",
        description: "Hide table header"
      },
      noRelativeDates: {
        type: "boolean",
        description: "Show dates in absolute format"
      },
      noTruncate: {
        type: "boolean",
        description: "Do not truncate output"
      }
    },
    required: []
  }
};