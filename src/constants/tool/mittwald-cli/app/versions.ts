import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_app_versions: Tool = {
  name: "mittwald_app_versions",
  description: "List supported Apps and Versions.",
  inputSchema: {
    type: "object",
    properties: {
      app: {
        type: "string",
        description: "Name of specific app to get versions for (optional)"
      },
      output: {
        type: "string",
        enum: ["txt", "json", "yaml", "csv", "tsv"],
        description: "Output format"
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
        description: "Do not truncate output (only relevant for txt output)"
      },
      noRelativeDates: {
        type: "boolean",
        description: "Show dates in absolute format, not relative (only relevant for txt output)"
      },
      csvSeparator: {
        type: "string",
        enum: [",", ";"],
        description: "Separator for CSV output (only relevant for CSV output)"
      }
    },
    required: []
  }
};