import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../../types/tool-registry.js';
import { handleDatabaseMysqlImportCli } from '../../../../../handlers/tools/mittwald-cli/database/mysql/import-cli.js';

const tool: Tool = {
  name: "mittwald_database_mysql_import",
  title: "Get MySQL Import Instructions",
  annotations: {
    title: "Get MySQL Import Instructions",
    readOnlyHint: true,
    destructiveHint: false,
  },
  description:
    "Get a ready-to-run command that imports a local dump file into a MySQL database via SSH. " +
    "This tool does not import anything itself - run the returned command locally. " +
    "Note that running the returned command overwrites data in the target database.",
  inputSchema: {
    type: "object",
    properties: {
      databaseId: {
        type: "string",
        description: "The ID or name of the database"
      },
      input: {
        type: "string",
        description: "Local dump file to import; defaults to <database>.sql (or .sql.gz with gzip)"
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
        description: "The input file is gzip-compressed and should be decompressed while importing"
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
  handler: handleDatabaseMysqlImportCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_database_mysql_import_cli = tool;
