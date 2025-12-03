import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../../types/tool-registry.js';
import { handleDatabaseMysqlGetCli } from '../../../../../handlers/tools/mittwald-cli/database/mysql/get-cli.js';

const tool: Tool = {
  name: "mittwald_database_mysql_get",
  title: "Get MySQL Database Details",
  description: "Get a MySQL database.",
  inputSchema: {
    type: "object",
    properties: {
      databaseId: {
        type: "string",
        description: "The ID or name of the database"
      },
      output: {
        type: "string",
        enum: ["txt", "json", "yaml"],
        description: "Output format (default: json for structured data)"
      }
    },
    required: ["databaseId"]
  }
};

// Export the tool registration
const registration: ToolRegistration = {
  tool,
  handler: handleDatabaseMysqlGetCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_database_mysql_get_cli = tool;