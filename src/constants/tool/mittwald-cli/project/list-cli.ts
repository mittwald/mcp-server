import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleMittwaldProjectListCli } from '../../../../handlers/tools/mittwald-cli/project/list-cli.js';

const tool: Tool = {
  name: "mittwald_project_list",
  title: "List Projects",
  description: "List all projects that you have access to.",
  inputSchema: {
    type: "object",
    properties: {
      output: {
        type: "string",
        description: "Output format",
        enum: ["txt", "json", "yaml", "csv", "tsv"]
      },
      extended: {
        type: "boolean",
        description: "Show extended information"
      },
      csvSeparator: {
        type: "string",
        description: "Separator for CSV output (only relevant for CSV output)",
        enum: [",", ";"]
      },
      noHeader: {
        type: "boolean",
        description: "Hide table header"
      },
      noRelativeDates: {
        type: "boolean",
        description: "Show dates in absolute format, not relative (only relevant for txt output)"
      },
      noTruncate: {
        type: "boolean",
        description: "Do not truncate output (only relevant for txt output)"
      }
    },
    required: []
  }
};

// Export the tool registration
const registration: ToolRegistration = {
  tool,
  handler: handleMittwaldProjectListCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_project_list_cli = tool;