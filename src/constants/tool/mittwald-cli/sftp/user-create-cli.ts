import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const mittwaldSftpUserCreateCli: Tool = {
  name: "mittwald_sftp_user_create_cli",
  description: "Create a new SFTP user (CLI wrapper)",
  inputSchema: {
    type: "object",
    properties: {
      projectId: {
        type: "string",
        description: "ID or short ID of a project; this flag is optional if a default project is set in the context"
      },
      description: {
        type: "string",
        description: "Set description for SFTP user",
        required: true
      },
      directories: {
        type: "array",
        items: {
          type: "string"
        },
        description: "Specify directories to restrict this SFTP user's access to",
        required: true
      },
      quiet: {
        type: "boolean",
        description: "Suppress process output and only display a machine-readable summary",
        default: false
      },
      expires: {
        type: "string",
        description: "An interval after which the SFTP user expires (examples: 30m, 30d, 1y)"
      },
      publicKey: {
        type: "string",
        description: "Public key used for authentication"
      },
      password: {
        type: "string",
        description: "Password used for authentication"
      },
      accessLevel: {
        type: "string",
        enum: ["read", "full"],
        description: "Set access level permissions for the SFTP user"
      }
    },
    required: ["description", "directories"]
  }
};