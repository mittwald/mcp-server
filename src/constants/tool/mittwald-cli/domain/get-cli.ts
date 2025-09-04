import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleDomainGetCli } from '../../../../handlers/tools/mittwald-cli/domain/get-cli.js';

const tool: Tool = {
  name: "mittwald_domain_get",
  title: "Get Domain Info",
  description: "Get domain information..",
  inputSchema: {
    type: "object",
    properties: {
      domainId: {
        type: "string",
        description: "The domain ID"
      },
      output: {
        type: "string",
        enum: ["txt", "json", "yaml"],
        description: "Output format (internally converted to JSON for processing)"
      }
    },
    required: ["domainId"]
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleDomainGetCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_domain_get_cli = tool;