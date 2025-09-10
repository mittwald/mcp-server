import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleExtensionInstallCli } from '../../../../handlers/tools/mittwald-cli/extension/install-cli.js';

const tool: Tool = {
  name: 'mittwald_extension_install',
  title: 'Install Extension',
  description: 'Install an extension in a project or organization.',
  inputSchema: {
    type: 'object',
    properties: {
      extensionId: {
        type: 'string',
        description: 'ID of the extension to install'
      },
      projectId: {
        type: 'string',
        description: 'ID of the project to install the extension in'
      },
      orgId: {
        type: 'string',
        description: 'ID of the organization to install the extension in'
      },
      quiet: {
        type: 'boolean',
        description: 'Suppress process output and only display a machine-readable summary'
      },
      consent: {
        type: 'boolean',
        description: 'Consent to the extension having access to the requested scopes'
      }
    },
    required: ["extensionId", "projectId"]
  }
};

// Export the tool registration
const registration: ToolRegistration = {
  tool,
  handler: handleExtensionInstallCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_extension_install_cli = tool;