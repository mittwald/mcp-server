import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleSftpUserListCli } from '../../../../handlers/tools/mittwald-cli/sftp/user-list-cli.js';

const tool: Tool = {
  name: "mittwald_sftp_user_list",
  title: "List SFTP Users",
  description: "List all SFTP users for a project.",
  inputSchema: {
    type: "object",
    properties: {
      projectId: {
        type: "string",
        description: "ID or short ID of a project; this flag is optional if a default project is set in the context"
      },
      output: {
        type: "string",
        enum: ["txt", "json", "yaml", "csv", "tsv"],
        description: "Output in a more machine friendly format",
        default: "txt"
      },
      extended: {
        type: "boolean",
        description: "Show extended information",
        default: false
      },
      noHeader: {
        type: "boolean",
        description: "Hide table header",
        default: false
      },
      noTruncate: {
        type: "boolean",
        description: "Do not truncate output (only relevant for txt output)",
        default: false
      },
      noRelativeDates: {
        type: "boolean",
        description: "Show dates in absolute format, not relative (only relevant for txt output)",
        default: false
      },
      csvSeparator: {
        type: "string",
        enum: [",", ";"],
        description: "Separator for CSV output (only relevant for CSV output)",
        default: ","
      }
    },
    required: ["projectId"]
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleSftpUserListCli,
  schema: tool.inputSchema
};

export default registration;