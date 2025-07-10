import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleSshUserUpdateCli } from '../../../../handlers/tools/mittwald-cli/ssh/user-update-cli.js';

const tool: Tool = {
  name: "mittwald_ssh_user_update_cli",
  description: "Update an existing SSH user (CLI wrapper)",
  inputSchema: {
    type: "object",
    properties: {
      sshUserId: {
        type: "string",
        description: "The ID of the SSH user to update",
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
      description: {
        type: "string",
        description: "Set description for SSH user"
      },
      publicKey: {
        type: "string",
        description: "Public key used for authentication"
      },
      password: {
        type: "string",
        description: "Password used for authentication"
      },
      enable: {
        type: "boolean",
        description: "Enable the SSH user"
      },
      disable: {
        type: "boolean",
        description: "Disable the SSH user"
      }
    },
    required: ["sshUserId"]
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleSshUserUpdateCli,
  schema: tool.inputSchema
};

export default registration;