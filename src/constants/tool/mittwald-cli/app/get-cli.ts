import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleAppGetCli } from '../../../../handlers/tools/mittwald-cli/app/get-cli.js';

const tool: Tool = {
  name: 'mittwald_app_get',
  title: 'Get App Details',
  description: 'Get details about an app installation.',
  inputSchema: {
    type: 'object',
    properties: {
      installationId: {
        type: 'string',
        description: 'ID or short ID of an app installation; this argument is optional if a default app installation is set in the context'
      },
      output: {
        type: 'string',
        enum: ['txt', 'json', 'yaml'],
        description: 'Output format',
        default: 'txt'
      }
    }
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleAppGetCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_app_get_cli = tool;