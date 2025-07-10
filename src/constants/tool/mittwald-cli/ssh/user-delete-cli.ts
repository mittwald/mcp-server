import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const mittwaldSshUserDeleteCli: Tool = {
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