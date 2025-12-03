import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../../types/tool-registry.js';
import { handleDatabaseMysqlImportCli } from '../../../../../handlers/tools/mittwald-cli/database/mysql/import-cli.js';

const tool: Tool = {
  name: "mittwald_database_mysql_import",
  title: "Import MySQL Database",
  description: "Import a dump into a MySQL database.",
  inputSchema: {
    type: "object",
    properties: {
      databaseId: {
        type: "string",
        description: "The ID or name of the database"
      },
      input: {
        type: "string",
        description: "The input file from which to read the dump ('-' for stdin)"
      },
      quiet: {
        type: "boolean",
        description: "Suppress process output and only display a machine-readable summary"
      },
      mysqlPassword: {
        type: "string",
        description: "The password to use for the MySQL user (security risk - prefer environment variable MYSQL_PWD)"
      },
      mysqlCharset: {
        type: "string",
        description: "The character set to use for the MySQL connection"
      },
      temporaryUser: {
        type: "boolean",
        description: "Create a temporary user for the import (recommended for security)"
      },
      sshUser: {
        type: "string",
        description: "Override the SSH user to connect with"
      },
      sshIdentityFile: {
        type: "string",
        description: "The SSH identity file (private key) to use for public key authentication"
      },
      gzip: {
        type: "boolean",
        description: "Uncompress the dump with gzip while importing"
      }
    },
    required: ["databaseId", "input"]
  }
};

// Export the tool registration
const registration: ToolRegistration = {
  tool,
  handler: handleDatabaseMysqlImportCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_database_mysql_import_cli = tool;