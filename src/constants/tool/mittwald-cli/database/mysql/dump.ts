import { MittwaldTool } from "../../../../../types";

export const MITTWALD_DATABASE_MYSQL_DUMP_TOOL: MittwaldTool = {
  name: "mittwald_database_mysql_dump",
  description: "Create a dump of a MySQL database",
  input_schema: {
    type: "object",
    properties: {
      databaseId: {
        type: "string",
        description: "The ID or name of the database",
      },
      output: {
        type: "string",
        description: "The output file to write the dump to (\"-\" for stdout)",
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
        description: "Compress the dump with gzip",
      },
      mysqlCharset: {
        type: "string",
        description: "The character set to use for the MySQL connection",
      },
      temporaryUser: {
        type: "boolean",
        description: "Create a temporary user for the dump (default: true)",
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
    required: ["databaseId", "output"],
  },
};