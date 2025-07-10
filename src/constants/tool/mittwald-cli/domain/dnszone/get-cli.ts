import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../../types/tool-registry.js';
import { handleDomainDnszoneGetCli } from '../../../../../handlers/tools/mittwald-cli/domain/dnszone/get-cli.js';

const tool: Tool = {
  name: "mittwald_domain_dnszone_get_cli",
  description: "Get DNS zone information using CLI wrapper.",
  inputSchema: {
    type: "object",
    properties: {
      dnszoneId: {
        type: "string",
        description: "The DNS zone ID"
      },
      output: {
        type: "string",
        enum: ["txt", "json", "yaml"],
        description: "Output format (internally converted to JSON for processing)"
      }
    },
    required: ["dnszoneId"]
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleDomainDnszoneGetCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_domain_dnszone_get_cli = tool;