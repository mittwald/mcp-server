import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_database_mysql_delete_cli: Tool = {
  name: "mittwald_database_mysql_delete_cli",
  description: "Delete a MySQL database using CLI wrapper",
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
      force: {
        type: "boolean",
        description: "Do not ask for confirmation",
      },
    },
    required: ["databaseId"],
  },
};