import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleDomainCheckCli } from '../../../../handlers/tools/mittwald-cli/domain/check-cli.js';

const tool: Tool = {
  name: 'mittwald_domain_check',
  title: 'Check Domain Availability',
  annotations: {
    title: 'Check Domain Availability',
    readOnlyHint: true,
    destructiveHint: false,
    openWorldHint: false,
  },
  description:
    'Check whether a domain can be registered (or, if it is taken, transferred) at mittwald, and which owner ' +
    'details its domain ending requires. Use this before mittwald_domain_order_preview when a user wants to ' +
    'register or buy a domain.',
  inputSchema: {
    type: 'object',
    properties: {
      domain: {
        type: 'string',
        description: 'Fully qualified domain name, e.g. example.de',
      },
      authCode: {
        type: 'string',
        description: 'Auth code from the current registrar; only needed to check whether a taken domain can be transferred',
      },
    },
    required: ['domain'],
  },
};

const registration: ToolRegistration = {
  tool,
  handler: handleDomainCheckCli,
  schema: tool.inputSchema,
};

export default registration;
