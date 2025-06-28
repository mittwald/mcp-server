import { MittwaldTool } from "../../../../../types";

export const MITTWALD_DATABASE_MYSQL_SHELL_TOOL: MittwaldTool = {
  name: "mittwald_database_mysql_shell",
  description: "Connect to a MySQL database with an interactive shell",
  input_schema: {
    type: "object",
    properties: {
      databaseId: {
        type: "string",
        description: "The ID or name of the database",
      },
      mysqlPassword: {
        type: "string",
        description: "The password to use for the MySQL user (optional, will use env or prompt)",
      },
      mysqlCharset: {
        type: "string",
        description: "The character set to use for the MySQL connection",
      },
      temporaryUser: {
        type: "boolean",
        description: "Create a temporary user for the shell (default: true)",
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
    required: ["databaseId"],
  },
};