import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const mittwaldSftpUser: Tool = {
  name: "mittwald_sftp_user",
  description: "Manage SFTP users of your projects - shows available SFTP user commands",
  inputSchema: {
    type: "object",
    properties: {
      help: {
        type: "boolean",
        description: "Show help information for SFTP user commands",
        default: true
      }
    },
    required: []
  }
};