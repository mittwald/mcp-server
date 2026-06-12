import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../../types/tool-registry.js';
import { handleDatabaseMysqlListCli } from '../../../../../handlers/tools/mittwald-cli/database/mysql/list-cli.js';

const tool: Tool = {
  name: "mittwald_database_mysql_list",
  title: "List MySQL Databases",
  description: "List MySQL databases.",
  inputSchema: {
    type: "object",
    properties: {
      projectId: {
        type: "string",
        description: "Project ID to list databases for"
      }
    },
    required: ["projectId"]
  }
};

// Export the tool registration
const registration: ToolRegistration = {
  tool,
  handler: handleDatabaseMysqlListCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_database_mysql_list_cli = tool;