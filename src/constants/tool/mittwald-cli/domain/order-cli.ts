import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../types/tool-registry.js';
import { handleDomainOrderCli } from '../../../../handlers/tools/mittwald-cli/domain/order-cli.js';

const tool: Tool = {
  name: 'mittwald_domain_order',
  title: 'Order Domain',
  annotations: {
    title: 'Order Domain',
    readOnlyHint: false,
    destructiveHint: false,
    openWorldHint: true,
  },
  description:
    'Order (register or transfer) a domain. This costs money. Only call this after you showed the overview from ' +
    'mittwald_domain_order_preview to the user and the user explicitly approved the order. The order is placed ' +
    'exactly as previewed; to change anything, run the preview again. Depending on the client, the user is asked ' +
    'to confirm the order once more.',
  inputSchema: {
    type: 'object',
    properties: {
      confirmationToken: {
        type: 'string',
        description: 'confirmationToken returned by mittwald_domain_order_preview; it can be used only once',
      },
    },
    required: ['confirmationToken'],
  },
};

const registration: ToolRegistration = {
  tool,
  handler: handleDomainOrderCli,
  schema: tool.inputSchema,
};

export default registration;
