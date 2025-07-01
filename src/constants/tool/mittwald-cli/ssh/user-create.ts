import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const mittwaldSshUserCreate: Tool = {
  name: "mittwald_ssh_user_create",
  description: "Create a new SSH user. You must specify authenticationMethod as either 'password' or 'publickey' and provide the corresponding credential.",
  inputSchema: {
    type: "object",
    properties: {
      projectId: {
        type: "string",
        description: "ID or short ID of a project; this flag is optional if a default project is set in the context"
      },
      description: {
        type: "string",
        description: "Set description for SSH user"
      },
      authenticationMethod: {
        type: "string",
        enum: ["password", "publickey"],
        description: "Authentication method for the SSH user (required)"
      },
      quiet: {
        type: "boolean",
        description: "Suppress process output and only display a machine-readable summary",
        default: false
      },
      expiresAt: {
        type: "string",
        description: "Expiration date for the SSH user (ISO 8601 format, e.g., '2024-12-31T23:59:59Z')"
      },
      publicKey: {
        type: "string",
        description: "SSH public key (required if authenticationMethod is 'publickey'). Format: 'ssh-rsa AAAA...'"
      },
      password: {
        type: "string",
        description: "Password for SSH authentication (required if authenticationMethod is 'password')"
      }
    },
    required: ["description", "authenticationMethod"]
  }
};