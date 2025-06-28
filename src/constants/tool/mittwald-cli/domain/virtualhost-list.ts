import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_domain_virtualhost_list: Tool = {
  name: "mittwald_domain_virtualhost_list",
  description: "List all virtual hosts for a project or all projects.",
  inputSchema: {
    type: "object",
    properties: {
      projectId: {
        type: "string",
        description: "ID or short ID of a project"
      },
      all: {
        type: "boolean",
        description: "List all virtual hosts (do not filter by project)"
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
    required: []
  }
};