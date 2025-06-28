import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const MITTWALD_DATABASE_MYSQL_PHPMYADMIN_TOOL: Tool = {
  name: "mittwald_database_mysql_phpmyadmin",
  description: "Open phpMyAdmin for a MySQL database",
  input_schema: {
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