import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const mittwaldSftpUserDelete: Tool = {
  name: "mittwald_sftp_user_delete",
  description: "Delete an SFTP user",
  inputSchema: {
    type: "object",
    properties: {
      sftpUserId: {
        type: "string",
        description: "The ID of the SFTP user to delete"
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