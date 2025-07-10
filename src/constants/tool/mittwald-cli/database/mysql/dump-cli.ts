import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_database_mysql_dump_cli: Tool = {
  name: "mittwald_database_mysql_dump_cli",
  description: "Create a dump of a MySQL database using CLI wrapper",
  inputSchema: {
    type: "object",
    properties: {
      databaseId: {
        type: "string",
        description: "The ID or name of the database",
      },
      output: {
        type: "string",
        description: "The output file to write the dump to ('-' for stdout)",
      },
      quiet: {
        type: "boolean",
        description: "Suppress process output and only display a machine-readable summary",
      },
      mysqlPassword: {
        type: "string",
        description: "The password to use for the MySQL user (security risk - prefer environment variable MYSQL_PWD)",
      },
      mysqlCharset: {
        type: "string",
        description: "The character set to use for the MySQL connection",
      },
      temporaryUser: {
        type: "boolean",
        description: "Create a temporary user for the dump (recommended for security)",
      },
      sshUser: {
        type: "string",
        description: "Override the SSH user to connect with",
      },
      sshIdentityFile: {
        type: "string",
        description: "The SSH identity file (private key) to use for public key authentication",
      },
      gzip: {
        type: "boolean",
        description: "Compress the dump with gzip (recommended for large databases)",
      },
    },
    required: ["databaseId", "output"],
  },
};