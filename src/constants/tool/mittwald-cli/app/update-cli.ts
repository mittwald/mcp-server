import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleAppUpdateCli } from '../../../../handlers/tools/mittwald-cli/app/update-cli.js';

const tool: Tool = {
  name: 'mittwald_app_update_cli',
  description: 'Update properties of an app installation using CLI (use upgrade to update the app version)',
  inputSchema: {
    type: 'object',
    properties: {
      installationId: {
        type: 'string',
        description: 'ID or short ID of an app installation; this argument is optional if a default app installation is set in the context'
      },
      quiet: {
        type: 'boolean',
        description: 'Suppress process output and only display a machine-readable summary'
      },
      description: {
        type: 'string',
        description: 'Update the description of the app installation'
      },
      entrypoint: {
        type: 'string',
        description: 'Update the entrypoint of the app installation (Python and Node.js only)'
      },
      documentRoot: {
        type: 'string',
        description: 'Update the document root of the app installation'
      }
    }
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleAppUpdateCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_app_update_cli = tool;