import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleOrgGetCli } from '../../../../handlers/tools/mittwald-cli/org/get-cli.js';

const tool: Tool = {
  name: 'mittwald_org_get',
  title: 'Get Organization',
  description: 'Get detailed information about a specific organization.',
  inputSchema: {
    type: 'object',
    properties: {
      organizationId: {
        type: 'string',
        description: 'Organization ID to fetch (format: o-XXXXX)'
      }
    },
    required: ['organizationId']
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleOrgGetCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_org_get_cli = tool;
