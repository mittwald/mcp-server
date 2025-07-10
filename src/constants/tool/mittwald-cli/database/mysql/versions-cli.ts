import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_database_mysql_versions_cli: Tool = {
  name: "mittwald_database_mysql_versions_cli",
  description: "List available MySQL versions using CLI wrapper",
  inputSchema: {
    type: "object",
    properties: {
      output: {
        type: "string",
        enum: ["txt", "json", "yaml", "csv", "tsv"],
        description: "Output format (default: json for structured data)",
        default: "json",
      },
      extended: {
        type: "boolean",
        description: "Show extended information",
      },
      noHeader: {
        type: "boolean",
        description: "Hide table header (only relevant for txt output)",
      },
      noTruncate: {
        type: "boolean",
        description: "Do not truncate output (only relevant for txt output)",
      },
      noRelativeDates: {
        type: "boolean",
        description: "Show dates in absolute format, not relative (only relevant for txt output)",
      },
      csvSeparator: {
        type: "string",
        enum: [",", ";"],
        description: "Separator for CSV output (only relevant for CSV output)",
        default: ",",
      },
    },
    required: [],
  },
};