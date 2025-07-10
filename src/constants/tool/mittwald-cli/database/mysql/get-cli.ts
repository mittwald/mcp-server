import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_database_mysql_get_cli: Tool = {
  name: "mittwald_database_mysql_get_cli",
  description: "Get a MySQL database using CLI wrapper",
  inputSchema: {
    type: "object",
    properties: {
      databaseId: {
        type: "string",
        description: "The ID or name of the database",
      },
      output: {
        type: "string",
        enum: ["txt", "json", "yaml"],
        description: "Output format (default: json for structured data)",
        default: "json",
      },
    },
    required: ["databaseId"],
  },
};