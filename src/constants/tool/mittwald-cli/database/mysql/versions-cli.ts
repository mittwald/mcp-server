import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../../types/tool-registry.js';
import { handleDatabaseMysqlVersionsCli } from '../../../../../handlers/tools/mittwald-cli/database/mysql/versions-cli.js';

const tool: Tool = {
  name: "mittwald_database_mysql_versions",
  title: "List MySQL Versions",
  annotations: {
    title: "List MySQL Versions",
    readOnlyHint: true,
    destructiveHint: false,
  },
  description: "List available MySQL versions.",
  inputSchema: {
    type: "object",
    properties: {},
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