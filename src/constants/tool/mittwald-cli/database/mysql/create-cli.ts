import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_database_mysql_create_cli: Tool = {
  name: "mittwald_database_mysql_create_cli",
  description: "Create a new MySQL database using CLI wrapper",
  inputSchema: {
    type: "object",
    properties: {
      description: {
        type: "string",
        description: "A description for the database",
      },
      version: {
        type: "string",
        description: "The MySQL version to use (use 'database mysql versions' command to list available versions)",
      },
      projectId: {
        type: "string",
        description: "ID or short ID of a project; optional if a default project is set in the context",
      },
      quiet: {
        type: "boolean",
        description: "Suppress process output and only display a machine-readable summary",
      },
      collation: {
        type: "string",
        description: "The collation to use (default: utf8mb4_unicode_ci)",
        default: "utf8mb4_unicode_ci",
      },
      characterSet: {
        type: "string",
        description: "The character set to use (default: utf8mb4)",
        default: "utf8mb4",
      },
      userPassword: {
        type: "string",
        description: "The password to use for the default user",
      },
      userExternal: {
        type: "boolean",
        description: "Enable external access for default user",
      },
      userAccessLevel: {
        type: "string",
        enum: ["full", "readonly"],
        description: "The access level preset for the default user (default: full)",
        default: "full",
      },
    },
    required: ["description", "version"],
  },
};