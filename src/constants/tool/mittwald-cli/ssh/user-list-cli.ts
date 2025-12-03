import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleSshUserListCli } from '../../../../handlers/tools/mittwald-cli/ssh/user-list-cli.js';

const tool: Tool = {
  name: "mittwald_ssh_user_list",
  title: "List SSH Users",
  description: "List all SSH users for a project.",
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
        description: "Output in a more machine friendly format"
      },
      extended: {
        type: "boolean",
        description: "Show extended information"
      },
      noHeader: {
        type: "boolean",
        description: "Hide table header"
      },
      noTruncate: {
        type: "boolean",
        description: "Do not truncate output (only relevant for txt output)"
      },
      noRelativeDates: {
        type: "boolean",
        description: "Show dates in absolute format, not relative (only relevant for txt output)"
      },
      csvSeparator: {
        type: "string",
        enum: [",", ";"],
        description: "Separator for CSV output (only relevant for CSV output)"
      }
    },
    required: ["projectId"]
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleSshUserListCli,
  schema: tool.inputSchema
};

export default registration;