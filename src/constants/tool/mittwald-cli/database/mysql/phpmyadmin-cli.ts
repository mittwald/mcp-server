import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../../types/tool-registry.js';
import { handleDatabaseMysqlPhpmyadminCli } from '../../../../../handlers/tools/mittwald-cli/database/mysql/phpmyadmin-cli.js';

const tool: Tool = {
  name: "mittwald_database_mysql_phpmyadmin_cli",
  description: "Open phpMyAdmin for a MySQL database (provides command for browser execution)",
  inputSchema: {
    type: "object",
    properties: {
      databaseId: {
        type: "string",
        description: "The ID or name of the database",
      },
    },
    required: ["databaseId"],
  },
};

// Export the tool registration
const registration: ToolRegistration = {
  tool,
  handler: handleDatabaseMysqlPhpmyadminCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_database_mysql_phpmyadmin_cli = tool;