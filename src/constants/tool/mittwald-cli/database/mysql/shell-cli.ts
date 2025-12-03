import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../../types/tool-registry.js';
import { handleDatabaseMysqlShellCli } from '../../../../../handlers/tools/mittwald-cli/database/mysql/shell-cli.js';

const tool: Tool = {
  name: "mittwald_database_mysql_shell",
  title: "Open MySQL Shell",
  description: "Connect to a MySQL database via the MySQL shell (provides command for interactive execution)",
  inputSchema: {
    type: "object",
    properties: {
      databaseId: {
        type: "string",
        description: "The ID or name of the database"
      },
      quiet: {
        type: "boolean",
        description: "Suppress process output and only display a machine-readable summary"
      },
      sshUser: {
        type: "string",
        description: "Override the SSH user to connect with"
      },
      sshIdentityFile: {
        type: "string",
        description: "The SSH identity file (private key) to use for public key authentication"
      },
      mysqlPassword: {
        type: "string",
        description: "The password to use for the MySQL user (security risk - prefer environment variable MYSQL_PWD)"
      },
      mysqlCharset: {
        type: "string",
        description: "The character set to use for the MySQL connection"
      }
    },
    required: ["databaseId"]
  }
};

// Export the tool registration
const registration: ToolRegistration = {
  tool,
  handler: handleDatabaseMysqlShellCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_database_mysql_shell_cli = tool;