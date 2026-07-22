import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../../types/tool-registry.js';
import { handleDatabaseMysqlCharsetsCli } from '../../../../../handlers/tools/mittwald-cli/database/mysql/charsets-cli.js';

const tool: Tool = {
  name: "mittwald_database_mysql_charsets",
  title: "List MySQL Character Sets",
  annotations: {
    title: "List MySQL Character Sets",
    readOnlyHint: true,
    destructiveHint: false,
    openWorldHint: false,
  },
  description: "List available MySQL character sets and collations.",
  inputSchema: {
    type: "object",
    properties: {},
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