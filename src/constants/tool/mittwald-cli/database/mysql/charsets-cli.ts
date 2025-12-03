import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../../types/tool-registry.js';
import { handleDatabaseMysqlCharsetsCli } from '../../../../../handlers/tools/mittwald-cli/database/mysql/charsets-cli.js';

const tool: Tool = {
  name: "mittwald_database_mysql_charsets",
  title: "List MySQL Character Sets",
  description: "List available MySQL character sets and collations.",
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
  handler: handleDatabaseMysqlCharsetsCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_database_mysql_charsets_cli = tool;