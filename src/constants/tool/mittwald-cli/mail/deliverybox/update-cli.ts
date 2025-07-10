/**
 * @file Tool definition for mittwald_mail_deliverybox_update_cli
 * @module constants/tool/mittwald-cli/mail/deliverybox/update-cli
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../../types/tool-registry.js';
import { handleMittwaldMailDeliveryboxUpdateCli } from '../../../../../handlers/tools/mittwald-cli/mail/deliverybox/update-cli.js';

const tool: Tool = {
  name: 'mittwald_mail_deliverybox_update_cli',
  description: 'Update a delivery box using Mittwald CLI',
  inputSchema: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        description: 'ID of the delivery box to update'
      },
      description: {
        type: 'string',
        description: 'New description for the delivery box'
      },
      quiet: {
        type: 'boolean',
        description: 'Suppress process output and only display a machine-readable summary'
      },
      password: {
        type: 'string',
        description: 'Delivery box password (CAUTION: providing this flag may log your password in shell history)'
      },
      randomPassword: {
        type: 'boolean',
        description: 'Generate a random password'
      }
    },
    required: ['id']
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleMittwaldMailDeliveryboxUpdateCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_mail_deliverybox_update_cli = tool;