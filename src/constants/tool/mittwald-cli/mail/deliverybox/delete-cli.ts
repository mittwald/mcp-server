/**
 * @file Tool definition for mittwald_mail_deliverybox_delete_cli
 * @module constants/tool/mittwald-cli/mail/deliverybox/delete-cli
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../../types/tool-registry.js';
import { handleMittwaldMailDeliveryboxDeleteCli } from '../../../../../handlers/tools/mittwald-cli/mail/deliverybox/delete-cli.js';

const tool: Tool = {
  name: 'mittwald_mail_deliverybox_delete',
  title: 'Delete Delivery Box',
  description: 'Delete a delivery box.',
  inputSchema: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        description: 'ID of the delivery box to delete'
      },
      confirm: {
        type: 'boolean',
        description: 'Must be set to true to confirm deletion (DESTRUCTIVE OPERATION - cannot be undone).'
      },
      force: {
        type: 'boolean',
        description: 'Do not ask for confirmation'
      }
    },
    required: ['id', 'confirm']
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleMittwaldMailDeliveryboxDeleteCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_mail_deliverybox_delete_cli = tool;
