import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleCertificateListCli } from '../../../../handlers/tools/mittwald-cli/certificate/list-cli.js';

const tool: Tool = {
  name: "mittwald_certificate_list",
  title: "List SSL Certificates",
  description: "List SSL/TLS certificates available for a domain.",
  inputSchema: {
    type: "object",
    properties: {
      projectId: {
        type: "string",
        description: "ID or short ID of a project; this flag is optional if a default project is set in the context"
      },
      domain: {
        type: "string",
        description: "Domain name to list certificates for"
      },
      output: {
        type: "string",
        enum: ["txt", "json", "yaml", "csv", "tsv"],
        description: "Output format (internally converted to JSON for processing)"
      }
    },
    required: ["projectId", "domain"]
  }
};

// Export the tool registration
const registration: ToolRegistration = {
  tool,
  handler: handleCertificateListCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_certificate_list_cli = tool;
