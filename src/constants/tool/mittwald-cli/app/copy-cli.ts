import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleAppCopyCli } from '../../../../handlers/tools/mittwald-cli/app/copy-cli.js';

const tool: Tool = {
  name: 'mittwald_app_copy',
  title: 'Copy App',
  description: 'Copy an app within a project.',
  inputSchema: {
    type: 'object',
    properties: {
      installationId: {
        type: 'string',
        description: 'ID or short ID of an app installation; this argument is optional if a default app installation is set in the context'
      },
      description: {
        type: 'string',
        description: 'Set a description for the new app installation'
      },
      quiet: {
        type: 'boolean',
        description: 'Suppress process output and only display a machine-readable summary'
      }
    },
    required: ['description', 'installationId']
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleAppCopyCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_app_copy_cli = tool;