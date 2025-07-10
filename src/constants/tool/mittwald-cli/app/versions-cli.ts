import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleAppVersionsCli } from '../../../../handlers/tools/mittwald-cli/app/versions-cli.js';

const tool: Tool = {
  name: 'mittwald_app_versions_cli',
  description: 'List supported Apps and Versions using CLI',
  inputSchema: {
    type: 'object',
    properties: {
      app: {
        type: 'string',
        description: 'Name of specific app to get versions for'
      }
    }
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleAppVersionsCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_app_versions_cli = tool;