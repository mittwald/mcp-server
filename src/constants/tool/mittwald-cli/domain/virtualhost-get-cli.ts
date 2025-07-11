import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleDomainVirtualhostGetCli } from '../../../../handlers/tools/mittwald-cli/domain/virtualhost-get-cli.js';

const tool: Tool = {
  name: 'mittwald_domain_virtualhost_get',
  description: 'Get details of a domain virtualhost using CLI',
  inputSchema: {
    type: 'object',
    properties: {
      virtualhostId: {
        type: 'string',
        description: 'ID of the virtualhost to get details for'
      },
      output: {
        type: 'string',
        enum: ['txt', 'json', 'yaml'],
        description: 'Output format (txt, json, yaml)'
      }
    },
    required: ['virtualhostId']
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleDomainVirtualhostGetCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_domain_virtualhost_get_cli = tool;