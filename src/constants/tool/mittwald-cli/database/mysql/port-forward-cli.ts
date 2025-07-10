import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_database_mysql_port_forward_cli: Tool = {
  name: "mittwald_database_mysql_port_forward_cli",
  description: "Forward the TCP port of a MySQL database to a local port (provides command for long-running execution)",
  inputSchema: {
    type: "object",
    properties: {
      databaseId: {
        type: "string",
        description: "The ID or name of the database",
      },
      quiet: {
        type: "boolean",
        description: "Suppress process output and only display a machine-readable summary",
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