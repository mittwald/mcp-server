import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_database_mysql_get: Tool = {
  name: "mittwald_database_mysql_get",
  description: "Get a MySQLDatabase",
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
        description: "Output format",
        default: "txt",
      },
    },
    required: ["databaseId", "output"],
  },
};