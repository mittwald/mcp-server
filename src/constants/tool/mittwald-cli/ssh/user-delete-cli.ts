import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleSshUserDeleteCli } from '../../../../handlers/tools/mittwald-cli/ssh/user-delete-cli.js';

const tool: Tool = {
  name: "mittwald_ssh_user_delete",
  title: "Delete SSH User",
  description: "Delete an SSH user.",
  inputSchema: {
    type: "object",
    properties: {
      sshUserId: {
        type: "string",
        description: "The ID of the SSH user to delete",
        required: true
      },
      confirm: {
        type: "boolean",
        description: "Must be set to true to confirm deletion (DESTRUCTIVE OPERATION - cannot be undone)."
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
    required: ["sshUserId", "confirm"]
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleSshUserDeleteCli,
  schema: tool.inputSchema
};

export default registration;
