import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_database_mysql_phpmyadmin_cli: Tool = {
  name: "mittwald_database_mysql_phpmyadmin_cli",
  description: "Open phpMyAdmin for a MySQL database (provides command for browser execution)",
  inputSchema: {
    type: "object",
    properties: {
      databaseId: {
        type: "string",
        description: "The ID or name of the database",
      },
    },
    required: ["databaseId"],
  },
};