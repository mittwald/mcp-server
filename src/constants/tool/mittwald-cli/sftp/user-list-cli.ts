import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleSftpUserListCli } from '../../../../handlers/tools/mittwald-cli/sftp/user-list-cli.js';

const tool: Tool = {
  name: "mittwald_sftp_user_list",
  title: "List SFTP Users",
  description: "List all SFTP users for a project.",
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
  handler: handleSftpUserListCli,
  schema: tool.inputSchema
};

export default registration;