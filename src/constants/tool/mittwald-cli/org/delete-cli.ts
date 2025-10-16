import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleOrgDeleteCli } from '../../../../handlers/tools/mittwald-cli/org/delete-cli.js';

const tool: Tool = {
  name: 'mittwald_org_delete',
  title: 'Delete Organization',
  description: 'Delete an organization. This is a destructive operation and cannot be undone.',
  inputSchema: {
    type: 'object',
    properties: {
      organizationId: {
        type: 'string',
        description: 'Organization ID to delete (format: o-XXXXX)'
      },
      confirm: {
        type: 'boolean',
        description: 'Must be set to true to confirm deletion (DESTRUCTIVE OPERATION)'
      }
    },
    required: ['organizationId', 'confirm']
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleOrgDeleteCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_org_delete_cli = tool;
