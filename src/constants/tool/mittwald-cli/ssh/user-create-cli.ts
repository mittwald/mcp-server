import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const mittwaldSshUserCreateCli: Tool = {
  name: "mittwald_ssh_user_create_cli",
  description: "Create a new SSH user (CLI wrapper)",
  inputSchema: {
    type: "object",
    properties: {
      projectId: {
        type: "string",
        description: "ID or short ID of a project; this flag is optional if a default project is set in the context"
      },
      description: {
        type: "string",
        description: "Set description for SSH user",
        required: true
      },
      quiet: {
        type: "boolean",
        description: "Suppress process output and only display a machine-readable summary",
        default: false
      },
      expires: {
        type: "string",
        description: "An interval after which the SSH user expires (examples: 30m, 30d, 1y)"
      },
      publicKey: {
        type: "string",
        description: "Public key used for authentication"
      },
      password: {
        type: "string",
        description: "Password used for authentication"
      }
    },
    required: ["description"]
  }
};