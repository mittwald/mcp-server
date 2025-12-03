/**
 * @file Tool definition for mittwald_mail_deliverybox_get_cli
 * @module constants/tool/mittwald-cli/mail/deliverybox/get-cli
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../../types/tool-registry.js';
import { handleMittwaldMailDeliveryboxGetCli } from '../../../../../handlers/tools/mittwald-cli/mail/deliverybox/get-cli.js';

const tool: Tool = {
  name: 'mittwald_mail_deliverybox_get',
  title: 'Get Delivery Box Details',
  description: 'Get a specific delivery box.',
  inputSchema: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        description: 'ID of the delivery box to retrieve'
      },
      output: {
        type: 'string',
        enum: ['txt', 'json', 'yaml'],
        description: 'Output format'
      }
    },
    required: ['id']
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleMittwaldMailDeliveryboxGetCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_mail_deliverybox_get_cli = tool;