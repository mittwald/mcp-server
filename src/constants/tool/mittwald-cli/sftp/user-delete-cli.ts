import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const mittwaldSftpUserDeleteCli: Tool = {
  name: "mittwald_sftp_user_delete_cli",
  description: "Delete an SFTP user (CLI wrapper)",
  inputSchema: {
    type: "object",
    properties: {
      sftpUserId: {
        type: "string",
        description: "The ID of the SFTP user to delete",
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
    required: ["sftpUserId"]
  }
};