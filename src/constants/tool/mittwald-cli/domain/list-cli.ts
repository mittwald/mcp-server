import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleDomainListCli } from '../../../../handlers/tools/mittwald-cli/domain/list-cli.js';

const tool: Tool = {
  name: "mittwald_domain_list",
  title: "List Domains",
  annotations: {
    title: "List Domains",
    readOnlyHint: true,
    destructiveHint: false,
    openWorldHint: false,
  },
  description: "List domains belonging to a project..",
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
  handler: handleDomainListCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_domain_list_cli = tool;