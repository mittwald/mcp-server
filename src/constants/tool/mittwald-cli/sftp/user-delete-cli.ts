import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleSftpUserDeleteCli } from '../../../../handlers/tools/mittwald-cli/sftp/user-delete-cli.js';

const tool: Tool = {
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

const registration: ToolRegistration = {
  tool,
  handler: handleSftpUserDeleteCli,
  schema: tool.inputSchema
};

export default registration;