import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../../types/tool-registry.js';
import { handleDomainDnszoneListCli } from '../../../../../handlers/tools/mittwald-cli/domain/dnszone/list-cli.js';

const tool: Tool = {
  name: "mittwald_domain_dnszone_list",
  title: "List DNS Zones",
  description: "List DNS zones for a project..",
  inputSchema: {
    type: "object",
    properties: {
      projectId: {
        type: "string",
        description: "ID or short ID of a project"
      },
      output: {
        type: "string",
        enum: ["txt", "json", "yaml", "csv", "tsv"],
        description: "Output format (internally converted to JSON for processing)"
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

// Export the tool registration
const registration: ToolRegistration = {
  tool,
  handler: handleDomainDnszoneListCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_domain_dnszone_list_cli = tool;