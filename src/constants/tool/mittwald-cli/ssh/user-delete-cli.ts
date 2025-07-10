import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleSshUserDeleteCli } from '../../../../handlers/tools/mittwald-cli/ssh/user-delete-cli.js';

const tool: Tool = {
  name: "mittwald_ssh_user_delete_cli",
  description: "Delete an SSH user (CLI wrapper)",
  inputSchema: {
    type: "object",
    properties: {
      sshUserId: {
        type: "string",
        description: "The ID of the SSH user to delete",
        required: true
      },
      force: {
        type: "boolean",
        description: "Do not ask for confirmation",
        default: false
      },
      quiet: {
        type: "boolean",
        description: "Suppress process output and only display a machine-readable summary",
        default: false
      }
    },
    required: ["sshUserId"]
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleSshUserDeleteCli,
  schema: tool.inputSchema
};

export default registration;