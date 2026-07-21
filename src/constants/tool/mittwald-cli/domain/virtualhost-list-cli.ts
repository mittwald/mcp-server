import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleDomainVirtualhostListCli } from '../../../../handlers/tools/mittwald-cli/domain/virtualhost-list-cli.js';

const tool: Tool = {
  name: 'mittwald_domain_virtualhost_list',
  title: 'List Virtual Hosts',
  annotations: {
    title: 'List Virtual Hosts',
    readOnlyHint: true,
    destructiveHint: false,
  },
  description: 'List domain virtualhosts.',
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'ID or short ID of a project'
      }
    },
    required: ["projectId"]
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleDomainVirtualhostListCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_domain_virtualhost_list_cli = tool;