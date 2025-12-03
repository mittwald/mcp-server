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
      confirm: {
        type: "boolean",
        description: "Must be set to true to confirm deletion (DESTRUCTIVE OPERATION - cannot be undone)."
      },
      force: {
        type: "boolean",
        description: "Do not ask for confirmation"
      },
      quiet: {
        type: "boolean",
        description: "Suppress process output and only display a machine-readable summary"
      }
    },
    required: ["sftpUserId", "confirm"]
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleSftpUserDeleteCli,
  schema: tool.inputSchema
};

export default registration;
