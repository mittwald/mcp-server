import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../../types/tool-registry.js';
import { handleDatabaseMysqlDeleteCli } from '../../../../../handlers/tools/mittwald-cli/database/mysql/delete-cli.js';

const tool: Tool = {
  name: "mittwald_database_mysql_delete",
  title: "Delete MySQL Database",
  description: "Delete a MySQL database.",
  inputSchema: {
    type: "object",
    properties: {
      databaseId: {
        type: "string",
        description: "The ID or name of the database",
      },
      confirm: {
        type: 'boolean',
        description: 'Must be set to true to confirm deletion (DESTRUCTIVE OPERATION - cannot be undone).'
      },
      force: {
        type: "boolean",
        description: "Do not ask for confirmation",
      },
    },
    required: ["databaseId", "confirm"],
  },
};

// Export the tool registration
const registration: ToolRegistration = {
  tool,
  handler: handleDatabaseMysqlDeleteCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_database_mysql_delete_cli = tool;
