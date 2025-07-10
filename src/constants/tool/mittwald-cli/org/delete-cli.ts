import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleOrgDeleteCli } from '../../../../handlers/tools/mittwald-cli/org/delete.js';

const tool: Tool = {
  name: "mittwald_org_delete_cli",
  description: "Delete an organization using CLI wrapper",
  inputSchema: {
    type: "object",
    properties: {
      orgId: {
        type: "string",
        description: "ID or short ID of the organization to delete"
      },
      force: {
        type: "boolean",
        description: "Force deletion without interactive confirmation",
        default: false
      },
      quiet: {
        type: "boolean",
        description: "Suppress process output and only display a machine-readable summary",
        default: false
      }
    },
    required: []
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