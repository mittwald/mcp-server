import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const domain_dnszone_list: Tool = {
  name: "mittwald_domain_dnszone_list",
  description: "List all DNS zones by project ID. Shows DNS zones associated with projects with various output formats.",
  inputSchema: {
    type: "object",
    properties: {
      output: {
        type: "string",
        enum: ["txt", "json", "yaml", "csv", "tsv"],
        default: "txt",
        description: "Output format"
      },
      projectId: {
        type: "string",
        description: "ID or short ID of a project; optional if a default project is set in the context"
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
        default: ",",
        description: "Separator for CSV output (only relevant for CSV output)"
      }
    },
    required: []
  }
};