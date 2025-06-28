import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_project_list: Tool = {
  name: "mittwald_project_list",
  description: "List all projects that you have access to",
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
        description: "Separator for CSV output (only relevant for CSV output)",
        enum: [",", ";"],
        default: ","
      },
      noHeader: {
        type: "boolean",
        description: "Hide table header"
      },
      noRelativeDates: {
        type: "boolean",
        description: "Show dates in absolute format, not relative (only relevant for txt output)"
      },
      noTruncate: {
        type: "boolean",
        description: "Do not truncate output (only relevant for txt output)"
      }
    },
    required: []
  }
};