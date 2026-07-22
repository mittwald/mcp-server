import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../../types/tool-registry.js';
import { handleDatabaseMysqlDumpCli } from '../../../../../handlers/tools/mittwald-cli/database/mysql/dump-cli.js';

const tool: Tool = {
  name: "mittwald_database_mysql_dump",
  title: "Get MySQL Dump Instructions",
  annotations: {
    title: "Get MySQL Dump Instructions",
    readOnlyHint: true,
    destructiveHint: false,
    openWorldHint: false,
  },
  description:
    "Get a ready-to-run command that dumps a MySQL database via SSH and mysqldump into a local file. " +
    "This tool does not create the dump itself - run the returned command locally.",
  inputSchema: {
    type: "object",
    properties: {
      databaseId: {
        type: "string",
        description: "The ID or name of the database"
      },
      output: {
        type: "string",
        description: "Local file the dump should be written to; defaults to <database>.sql (or .sql.gz with gzip)"
      },
      mysqlPassword: {
        type: "string",
        description: "Password of the MySQL user; if omitted, the returned command contains a placeholder to fill in"
      },
      mysqlCharset: {
        type: "string",
        description: "Character set for the MySQL connection; defaults to the database's own character set"
      },
      gzip: {
        type: "boolean",
        description: "Compress the dump with gzip (recommended for large databases)"
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
  handler: handleDatabaseMysqlDumpCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_database_mysql_dump_cli = tool;
