import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../../types/tool-registry.js';
import { handleDatabaseMysqlPortForwardCli } from '../../../../../handlers/tools/mittwald-cli/database/mysql/port-forward-cli.js';

const tool: Tool = {
  name: "mittwald_database_mysql_port_forward",
  title: "Get MySQL Port Forwarding Instructions",
  annotations: {
    title: "Get MySQL Port Forwarding Instructions",
    readOnlyHint: true,
    destructiveHint: false,
    openWorldHint: false,
  },
  description:
    "Get a ready-to-run SSH port forwarding command that exposes a MySQL database on a local TCP port. " +
    "This tool does not open the tunnel itself - run the returned command locally.",
  inputSchema: {
    type: "object",
    properties: {
      databaseId: {
        type: "string",
        description: "The ID or name of the database"
      },
      port: {
        type: "number",
        description: "The local TCP port to forward to (default: 3306)"
      },
      sshUser: {
        type: "string",
        description: "Override the SSH user to connect with; if omitted, your own mStudio user will be used"
      },
      sshIdentityFile: {
        type: "string",
        description: "The SSH identity file (private key) to include in the returned ssh command"
      }
    },
    required: ["databaseId"]
  }
};

// Export the tool registration
const registration: ToolRegistration = {
  tool,
  handler: handleDatabaseMysqlPortForwardCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_database_mysql_port_forward_cli = tool;
