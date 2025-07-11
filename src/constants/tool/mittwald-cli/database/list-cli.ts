import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleDatabaseListCli } from '../../../../handlers/tools/mittwald-cli/database/list-cli.js';

const tool: Tool = {
  name: "mittwald_database_list",
  description: "List all databases using CLI wrapper",
  inputSchema: {
    type: "object",
    properties: {
      projectId: {
        type: "string",
        description: "Optional project ID to filter databases by project",
      },
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
        description: "Omit header row",
      },
      noTruncate: {
        type: "boolean",
        description: "Do not truncate output",
      },
      noRelativeDates: {
        type: "boolean",
        description: "Show absolute dates instead of relative dates",
      },
      csvSeparator: {
        type: "string",
        enum: [",", ";"],
        description: "CSV separator character",
      },
    },
    required: [],
  },
};

// Export the tool registration
const registration: ToolRegistration = {
  tool,
  handler: handleDatabaseListCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_database_list_cli = tool;