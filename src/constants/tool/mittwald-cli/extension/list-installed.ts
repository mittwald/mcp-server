import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_extension_list_installed: Tool = {
  name: "mittwald_extension_list_installed",
  description: "List installed extensions for a project.",
  inputSchema: {
    type: "object",
    properties: {
      projectId: {
        type: "string",
        description: "ID or short ID of a project"
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
        description: "Do not show table headers"
      },
      noTruncate: {
        type: "boolean",
        description: "Do not truncate output"
      },
      noRelativeDates: {
        type: "boolean",
        description: "Do not use relative dates"
      },
      csvSeparator: {
        type: "string",
        enum: [",", ";"],
        description: "CSV separator to use"
      }
    },
    required: ["projectId"]
  }
};