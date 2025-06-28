import { MittwaldTool } from "../../../../../types";

export const MITTWALD_DATABASE_MYSQL_IMPORT_TOOL: MittwaldTool = {
  name: "mittwald_database_mysql_import",
  description: "Imports a dump of a MySQL database",
  input_schema: {
    type: "object",
    properties: {
      databaseId: {
        type: "string",
        description: "The ID or name of the database",
      },
      input: {
        type: "string",
        description: "The input file from which to read the dump (\"-\" for stdin)",
      },
      mysqlPassword: {
        type: "string",
        description: "The password to use for the MySQL user (optional, will use env or prompt)",
      },
      quiet: {
        type: "boolean",
        description: "Suppress process output and only display a machine-readable summary",
      },
      gzip: {
        type: "boolean",
        description: "Uncompress the dump with gzip",
      },
      mysqlCharset: {
        type: "string",
        description: "The character set to use for the MySQL connection",
      },
      temporaryUser: {
        type: "boolean",
        description: "Create a temporary user for the import (default: true)",
      },
      sshUser: {
        type: "string",
        description: "Override the SSH user to connect with",
      },
      sshIdentityFile: {
        type: "string",
        description: "The SSH identity file (private key) to use for public key authentication",
      },
    },
    required: ["databaseId", "input"],
  },
};