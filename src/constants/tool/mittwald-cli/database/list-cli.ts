import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleDatabaseListCli } from '../../../../handlers/tools/mittwald-cli/database/list-cli.js';

const tool: Tool = {
  name: "mittwald_database_list",
  title: "List Databases",
  annotations: {
    title: "List Databases",
    readOnlyHint: true,
    destructiveHint: false,
  },
  description: "List all databases.",
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
  handler: handleDatabaseListCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_database_list_cli = tool;