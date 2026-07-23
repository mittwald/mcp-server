/**
 * @file Tool definition for mittwald_mail_deliverybox_list_cli
 * @module constants/tool/mittwald-cli/mail/deliverybox/list-cli
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../../types/tool-registry.js';
import { handleMittwaldMailDeliveryboxListCli } from '../../../../../handlers/tools/mittwald-cli/mail/deliverybox/list-cli.js';

const tool: Tool = {
  name: 'mittwald_mail_deliverybox_list',
  title: 'List Delivery Boxes',
  annotations: {
    title: 'List Delivery Boxes',
    readOnlyHint: true,
    destructiveHint: false,
    openWorldHint: false,
  },
  description: 'List all delivery boxes for a project.',
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'ID or short ID of a project; this flag is optional if a default project is set in the context'
      }
    },
    required: ["projectId"]
  }
};

// Export the tool registration
const registration: ToolRegistration = {
  tool,
  handler: handleMittwaldMailDeliveryboxListCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_mail_deliverybox_list_cli = tool;