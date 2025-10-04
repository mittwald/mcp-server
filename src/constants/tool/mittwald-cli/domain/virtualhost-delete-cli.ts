import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleDomainVirtualhostDeleteCli } from '../../../../handlers/tools/mittwald-cli/domain/virtualhost-delete-cli.js';

const tool: Tool = {
  name: 'mittwald_domain_virtualhost_delete',
  title: 'Delete Virtual Host',
  description: 'Delete a domain virtualhost.',
  inputSchema: {
    type: 'object',
    properties: {
      virtualhostId: {
        type: 'string',
        description: 'ID of the virtualhost to delete'
      },
      confirm: {
        type: 'boolean',
        description: 'Must be set to true to confirm deletion (DESTRUCTIVE OPERATION - cannot be undone).'
      },
      force: {
        type: 'boolean',
        description: 'Skip confirmation prompt'
      }
    },
    required: ['virtualhostId', 'confirm']
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleDomainVirtualhostDeleteCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_domain_virtualhost_delete_cli = tool;
