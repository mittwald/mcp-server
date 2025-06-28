import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const MITTWALD_DATABASE_MYSQL_PORT_FORWARD_TOOL: Tool = {
  name: "mittwald_database_mysql_port_forward",
  description: "Forward a local port to a MySQL database",
  input_schema: {
    type: "object",
    properties: {
      databaseId: {
        type: "string",
        description: "The ID or name of the database",
      },
      port: {
        type: "number",
        description: "The local port to forward to the database (default: 3306)",
        default: 3306,
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