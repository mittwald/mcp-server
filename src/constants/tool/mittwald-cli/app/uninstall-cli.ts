import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleAppUninstallCli } from '../../../../handlers/tools/mittwald-cli/app/uninstall-cli.js';

const tool: Tool = {
  name: 'mittwald_app_uninstall',
  description: 'Uninstall an app using CLI',
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
      force: {
        type: 'boolean',
        description: 'Do not ask for confirmation'
      }
    }
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleAppUninstallCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_app_uninstall_cli = tool;