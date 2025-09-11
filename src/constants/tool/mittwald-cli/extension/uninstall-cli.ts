import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleExtensionUninstallCli } from '../../../../handlers/tools/mittwald-cli/extension/uninstall-cli.js';

const tool: Tool = {
  name: 'mittwald_extension_uninstall',
  title: 'Uninstall Extension',
  description: 'Remove an extension from an organization.',
  inputSchema: {
    type: 'object',
    properties: {
      extensionInstanceId: {
        type: 'string',
        description: 'ID of the extension instance to uninstall'
      }
    },
    required: ['extensionInstanceId']
  }
};

// Export the tool registration
const registration: ToolRegistration = {
  tool,
  handler: handleExtensionUninstallCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_extension_uninstall_cli = tool;