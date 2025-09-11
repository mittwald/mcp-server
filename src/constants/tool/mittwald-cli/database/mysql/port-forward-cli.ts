import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../../types/tool-registry.js';
import { handleDatabaseMysqlPortForwardCli } from '../../../../../handlers/tools/mittwald-cli/database/mysql/port-forward-cli.js';

const tool: Tool = {
  name: "mittwald_database_mysql_port_forward",
  title: "Forward MySQL Port",
  description: "Forward the TCP port of a MySQL database to a local port (provides command for long-running execution)",
  inputSchema: {
    type: "object",
    properties: {
      databaseId: {
        type: "string",
        description: "The ID or name of the database",
      },
      sshUser: {
        type: "string",
        description: "Override the SSH user to connect with",
      },
      sshIdentityFile: {
        type: "string",
        description: "The SSH identity file (private key) to use for public key authentication",
      },
      port: {
        type: "number",
        description: "The local TCP port to forward to (default: 3306)",
        default: 3306,
      },
    },
    required: ["databaseId"],
  },
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