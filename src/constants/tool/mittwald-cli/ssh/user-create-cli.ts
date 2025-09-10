import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleSshUserCreateCli } from '../../../../handlers/tools/mittwald-cli/ssh/user-create-cli.js';

const tool: Tool = {
  name: "mittwald_ssh_user_create",
  title: "Create SSH User",
  description: "Create a new SSH user.",
  inputSchema: {
    type: "object",
    properties: {
      projectId: {
        type: "string",
        description: "ID or short ID of a project; this flag is optional if a default project is set in the context"
      },
      description: {
        type: "string",
        description: "Set description for SSH user",
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
      publicKey: {
        type: "string",
        description: "Public key used for authentication"
      },
      password: {
        type: "string",
        description: "Password used for authentication"
      }
    },
    required: ["description", "projectId"]
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleSshUserCreateCli,
  schema: tool.inputSchema
};

export default registration;