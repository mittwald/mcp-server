import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../../types/tool-registry.js';
import { handleDomainDnszoneListCli } from '../../../../../handlers/tools/mittwald-cli/domain/dnszone/list-cli.js';

const tool: Tool = {
  name: "mittwald_domain_dnszone_list",
  title: "List DNS Zones",
  annotations: {
    title: "List DNS Zones",
    readOnlyHint: true,
    destructiveHint: false,
  },
  description: "List DNS zones for a project..",
  inputSchema: {
    type: "object",
    properties: {
      projectId: {
        type: "string",
        description: "ID or short ID of a project"
      }
    },
    required: ["projectId"]
  }
};

// Export the tool registration
const registration: ToolRegistration = {
  tool,
  handler: handleDomainDnszoneListCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_domain_dnszone_list_cli = tool;