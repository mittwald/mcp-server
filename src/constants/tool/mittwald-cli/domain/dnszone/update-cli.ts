import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../../types/tool-registry.js';
import { handleDomainDnszoneUpdateCli } from '../../../../../handlers/tools/mittwald-cli/domain/dnszone/update-cli.js';

const tool: Tool = {
  name: "mittwald_domain_dnszone_update_cli",
  description: "Update DNS zone records using CLI wrapper.",
  inputSchema: {
    type: "object",
    properties: {
      dnszoneId: {
        type: "string",
        description: "The DNS zone ID"
      },
      recordSet: {
        type: "string",
        enum: ["a", "mx", "txt", "srv", "cname"],
        description: "The record set type to update"
      },
      projectId: {
        type: "string",
        description: "ID or short ID of a project"
      },
      set: {
        type: "array",
        items: {
          type: "string"
        },
        description: "Set record values"
      },
      recordId: {
        type: "string",
        description: "Specific record ID to update"
      },
      unset: {
        type: "array",
        items: {
          type: "string"
        },
        description: "Unset record values"
      },
      quiet: {
        type: "boolean",
        description: "Suppress output except for errors"
      },
      managed: {
        type: "boolean",
        description: "Update managed records"
      },
      record: {
        type: "array",
        items: {
          type: "string"
        },
        description: "Record values to set"
      },
      ttl: {
        type: "number",
        description: "Time to live for the record"
      }
    },
    required: ["dnszoneId", "recordSet"]
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleDomainDnszoneUpdateCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_domain_dnszone_update_cli = tool;