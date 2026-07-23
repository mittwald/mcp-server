import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleExtensionListCli } from '../../../../handlers/tools/mittwald-cli/extension/list-cli.js';

const tool: Tool = {
  name: 'mittwald_extension_list',
  title: 'List Available Extensions',
  annotations: {
    title: 'List Available Extensions',
    readOnlyHint: true,
    destructiveHint: false,
    openWorldHint: false,
  },
  description: 'List all available extensions.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  }
};

// Export the tool registration
const registration: ToolRegistration = {
  tool,
  handler: handleExtensionListCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_extension_list_cli = tool;