import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../../types/tool-registry.js';
import { handleAppCreateStaticCli } from '../../../../../handlers/tools/mittwald-cli/app/create/static-cli.js';

const tool: Tool = {
  name: 'mittwald_app_create_static',
  description: 'Create a static app using CLI',
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'ID or short ID of a project; this argument is optional if a default project is set in the context'
      },
      siteTitle: {
        type: 'string',
        description: 'Title for the new app'
      },
      documentRoot: {
        type: 'string',
        description: 'Document root directory for the static application'
      },
      quiet: {
        type: 'boolean',
        description: 'Suppress process output and only display a machine-readable summary'
      },
      wait: {
        type: 'boolean',
        description: 'Wait for the app to be ready'
      },
      waitTimeout: {
        type: 'number',
        description: 'Timeout for the wait operation in seconds'
      }
    },
    required: ['documentRoot']
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleAppCreateStaticCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_app_create_static_cli = tool;