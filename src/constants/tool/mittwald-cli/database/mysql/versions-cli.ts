import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../../types/tool-registry.js';
import { handleDatabaseMysqlVersionsCli } from '../../../../../handlers/tools/mittwald-cli/database/mysql/versions-cli.js';

const tool: Tool = {
  name: "mittwald_database_mysql_versions",
  title: "List MySQL Versions",
  description: "List available MySQL versions.",
  inputSchema: {
    type: "object",
    properties: {
      output: {
        type: "string",
        enum: ["txt", "json", "yaml", "csv", "tsv"],
        description: "Output format (default: json for structured data)"
      },
      extended: {
        type: "boolean",
        description: "Show extended information"
      },
      noHeader: {
        type: "boolean",
        description: "Hide table header (only relevant for txt output)"
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

// Export the tool registration
const registration: ToolRegistration = {
  tool,
  handler: handleDatabaseMysqlVersionsCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_database_mysql_versions_cli = tool;