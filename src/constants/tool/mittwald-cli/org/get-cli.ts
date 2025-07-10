import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration, ToolHandler } from '../../../../types/tool-registry.js';
import { handleOrgGetCli } from '../../../../handlers/tools/mittwald-cli/org/get.js';

const tool: Tool = {
  name: "mittwald_org_get_cli",
  description: "Get an organization profile using CLI wrapper",
  inputSchema: {
    type: "object",
    properties: {
      orgId: {
        type: "string",
        description: "ID or short ID of an org; this parameter is optional if a default org is set in the context"
      },
      output: {
        type: "string",
        description: "Output format",
        enum: ["txt", "json", "yaml"],
        default: "txt"
      }
    },
    required: []
  }
};

// Wrapper to adapt MittwaldToolHandler to ToolHandler
const handler: ToolHandler = async (args) => {
  return handleOrgGetCli(args, {} as any);
};

const registration: ToolRegistration = {
  tool,
  handler,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_org_get_cli = tool;