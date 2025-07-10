import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleSftpUserUpdateCli } from '../../../../handlers/tools/mittwald-cli/sftp/user-update-cli.js';

const tool: Tool = {
  name: "mittwald_sftp_user_update_cli",
  description: "Update an existing SFTP user (CLI wrapper)",
  inputSchema: {
    type: "object",
    properties: {
      sftpUserId: {
        type: "string",
        description: "The ID of the SFTP user to update",
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
      description: {
        type: "string",
        description: "Set description for SFTP user"
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
      },
      directories: {
        type: "array",
        items: {
          type: "string"
        },
        description: "Specify directories to restrict this SFTP user's access to"
      },
      enable: {
        type: "boolean",
        description: "Enable the SFTP user"
      },
      disable: {
        type: "boolean",
        description: "Disable the SFTP user"
      }
    },
    required: ["sftpUserId"]
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleSftpUserUpdateCli,
  schema: tool.inputSchema
};

export default registration;