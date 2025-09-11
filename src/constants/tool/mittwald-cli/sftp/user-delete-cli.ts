import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleSftpUserDeleteCli } from '../../../../handlers/tools/mittwald-cli/sftp/user-delete-cli.js';

const tool: Tool = {
  name: "mittwald_sftp_user_delete",
  title: "Delete SFTP User",
  description: "Delete an SFTP user.",
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
      }
    },
    required: ["sftpUserId"]
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleSftpUserDeleteCli,
  schema: tool.inputSchema
};

export default registration;