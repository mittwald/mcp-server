import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleSshUserListCli } from '../../../../handlers/tools/mittwald-cli/ssh/user-list-cli.js';

const tool: Tool = {
  name: "mittwald_ssh_user_list",
  title: "List SSH Users",
  description: "List all SSH users for a project.",
  inputSchema: {
    type: "object",
    properties: {
      projectId: {
        type: "string",
        description: "ID or short ID of a project; this flag is optional if a default project is set in the context"
      }
    },
    required: ["projectId"]
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleSshUserListCli,
  schema: tool.inputSchema
};

export default registration;