import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleExtensionListInstalledCli } from '../../../../handlers/tools/mittwald-cli/extension/list-installed-cli.js';

const tool: Tool = {
  name: 'mittwald_extension_list_installed',
  title: 'List Installed Extensions',
  annotations: {
    title: 'List Installed Extensions',
    readOnlyHint: true,
    destructiveHint: false,
    openWorldHint: false,
  },
  description: 'List installed extensions in a project or organization.',
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'ID of the project to list installed extensions for'
      },
      orgId: {
        type: 'string',
        description: 'ID of the organization to list installed extensions for'
      }
    },
    required: ["projectId"]
  }
};

// Export the tool registration
const registration: ToolRegistration = {
  tool,
  handler: handleExtensionListInstalledCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_extension_list_installed_cli = tool;