import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleCertificateRequestCli } from '../../../../handlers/tools/mittwald-cli/certificate/request-cli.js';

const tool: Tool = {
  name: "mittwald_certificate_request",
  title: "Request SSL Certificate",
  description: "Request a new SSL/TLS certificate for a domain using Let's Encrypt.",
  inputSchema: {
    type: "object",
    properties: {
      projectId: {
        type: "string",
        description: "ID or short ID of a project; this flag is optional if a default project is set in the context"
      },
      domain: {
        type: "string",
        description: "Domain name to request a certificate for"
      },
      autoRenew: {
        type: "boolean",
        description: "Enable automatic renewal of the certificate (default: true)"
      },
      subdomains: {
        type: "array",
        items: { type: "string" },
        description: "Additional subdomains to include in the certificate (e.g., www, api)"
      }
    },
    required: ["projectId", "domain"]
  }
};

// Export the tool registration
const registration: ToolRegistration = {
  tool,
  handler: handleCertificateRequestCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_certificate_request_cli = tool;
