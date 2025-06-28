import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_project_invite_list: Tool = {
  name: "mittwald_project_invite_list",
  description: "List all invites belonging to a project.",
  inputSchema: {
    type: "object",
    properties: {
      projectId: {
        type: "string",
        description: "ID or short ID of a project; this flag is optional if a default project is set in the context"
      },
      output: {
        type: "string",
        description: "Output format",
        enum: ["txt", "json", "yaml", "csv", "tsv"],
        default: "txt"
      },
      extended: {
        type: "boolean",
        description: "Show extended information",
        default: false
      },
      noHeader: {
        type: "boolean",
        description: "Hide table header",
        default: false
      },
      noTruncate: {
        type: "boolean",
        description: "Do not truncate output (only relevant for txt output)",
        default: false
      },
      noRelativeDates: {
        type: "boolean",
        description: "Show dates in absolute format, not relative (only relevant for txt output)",
        default: false
      },
      csvSeparator: {
        type: "string",
        description: "Separator for CSV output (only relevant for CSV output)",
        enum: [",", ";"],
        default: ","
      }
    },
    required: []
  }
};