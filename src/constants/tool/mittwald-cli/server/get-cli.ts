import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleServerGetCli } from '../../../../handlers/tools/mittwald-cli/server/get-cli.js';

const tool: Tool = {
  name: 'mittwald_server_get',
  title: 'Get Server Details',
  description: 'Get server details.. Retrieves information about a specific server.',
  inputSchema: {
    type: 'object',
    properties: {
      serverId: {
        type: 'string',
        description: 'ID or short ID of a server; this argument is optional if a default server is set in the context'
      },
      output: {
        type: 'string',
        enum: ['txt', 'json', 'yaml'],
        description: 'Output format (default: txt)'
      }
    },
    additionalProperties: false
  }
};

// Export the tool registration
const registration: ToolRegistration = {
  tool,
  handler: handleServerGetCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_server_get_cli = tool;