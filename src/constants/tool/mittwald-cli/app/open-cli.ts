import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleAppOpenCli } from '../../../../handlers/tools/mittwald-cli/app/open-cli.js';

const tool: Tool = {
  name: 'mittwald_app_open',
  title: 'Open App in Browser',
  description: 'Open an app installation in the browser.',
  inputSchema: {
    type: 'object',
    properties: {
      installationId: {
        type: 'string',
        description: 'ID or short ID of an app installation; this argument is optional if a default app installation is set in the context'
      }
    }
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleAppOpenCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_app_open_cli = tool;