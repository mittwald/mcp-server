import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../../types/tool-registry.js';
import { handleDatabaseMysqlCreateCli } from '../../../../../handlers/tools/mittwald-cli/database/mysql/create-cli.js';

const tool: Tool = {
  name: "mittwald_database_mysql_create",
  title: "Create MySQL Database",
  annotations: {
    title: "Create MySQL Database",
    readOnlyHint: false,
    destructiveHint: false,
  },
  description: "Create a new MySQL database.",
  inputSchema: {
    type: "object",
    properties: {
      description: {
        type: "string",
        description: "A description for the database"
      },
      version: {
        type: "string",
        description: "The MySQL version in '<major>.<minor>' format, e.g. '8.0' or '8.4'"
      },
      projectId: {
        type: "string",
        description: "ID or short ID of a project; optional if a default project is set in the context"
      },
      quiet: {
        type: "boolean",
        description: "Suppress process output and only display a machine-readable summary"
      },
      collation: {
        type: "string",
        description: "The collation to use (default: utf8mb4_unicode_ci)"
      },
      characterSet: {
        type: "string",
        description: "The character set to use (default: utf8mb4)"
      },
      userPassword: {
        type: "string",
        description: "The password for the default user. If omitted, a secure password is auto-generated. Requirements: min 8 chars, at least one special character (#!~%^*_+-=?{}()<>|.,;$:/), cannot start with -_;"
      },
      userExternal: {
        type: "boolean",
        description: "Enable external access for default user"
      },
      userAccessLevel: {
        type: "string",
        enum: ["full", "readonly"],
        description: "The access level preset for the default user (default: full)"
      }
    },
    required: ["description", "version", "projectId"]
  }
};

// Export the tool registration
const registration: ToolRegistration = {
  tool,
  handler: handleDatabaseMysqlCreateCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_database_mysql_create_cli = tool;