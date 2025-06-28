import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const mittwaldSshUserDelete: Tool = {
  name: "mittwald_ssh_user_delete",
  description: "Delete an SSH user",
  inputSchema: {
    type: "object",
    properties: {
      sshUserId: {
        type: "string",
        description: "The ID of the SSH user to delete"
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