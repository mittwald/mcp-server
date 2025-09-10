import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleDomainVirtualhostCreateCli } from '../../../../handlers/tools/mittwald-cli/domain/virtualhost-create-cli.js';

const tool: Tool = {
  name: 'mittwald_domain_virtualhost_create',
  title: 'Create Virtual Host',
  description: 'Create a domain virtualhost.',
  inputSchema: {
    type: 'object',
    properties: {
      hostname: {
        type: 'string',
        description: 'Hostname for the virtualhost'
      },
      projectId: {
        type: 'string',
        description: 'ID or short ID of a project; this argument is optional if a default project is set in the context'
      },
      quiet: {
        type: 'boolean',
        description: 'Suppress process output and only display a machine-readable summary'
      },
      pathToApp: {
        type: 'array',
        items: {
          type: 'string'
        },
        description: 'Path mappings to apps'
      },
      pathToUrl: {
        type: 'array',
        items: {
          type: 'string'
        },
        description: 'Path mappings to URLs'
      },
      pathToContainer: {
        type: 'array',
        items: {
          type: 'string'
        },
        description: 'Path mappings to containers'
      }
    },
    required: ["hostname", "projectId"]
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleDomainVirtualhostCreateCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_domain_virtualhost_create_cli = tool;