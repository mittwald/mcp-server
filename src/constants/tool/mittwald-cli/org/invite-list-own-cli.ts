import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration, ToolHandler } from '../../../../types/tool-registry.js';
import { handleOrgInviteListOwnCli } from '../../../../handlers/tools/mittwald-cli/org/invite-list-own-cli.js';

const tool: Tool = {
  name: "mittwald_org_invite_list_own",
  title: "List My Organization Invites",
  description: "List all organization invites for the executing user.",
  inputSchema: {
    type: "object",
    properties: {
      output: {
        type: "string",
        description: "Output format",
        enum: ["txt", "json", "yaml", "csv", "tsv"],
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
        description: "Separator for CSV output (only relevant for CSV output)",
        enum: [",", ";"],
        default: ","
      }
    },
    required: []
  }
};

// Wrapper to adapt MittwaldToolHandler to ToolHandler
const handler: ToolHandler = async (args) => {
  return handleOrgInviteListOwnCli(args, {} as any);
};

const registration: ToolRegistration = {
  tool,
  handler,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_org_invite_list_own_cli = tool;