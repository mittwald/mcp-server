/**
 * @file Tool definition for mittwald_mail_deliverybox_delete_cli
 * @module constants/tool/mittwald-cli/mail/deliverybox/delete-cli
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../../types/tool-registry.js';
import { handleMittwaldMailDeliveryboxDeleteCli } from '../../../../../handlers/tools/mittwald-cli/mail/deliverybox/delete-cli.js';

const tool: Tool = {
  name: 'mittwald_mail_deliverybox_delete',
  description: 'Delete a delivery box using Mittwald CLI',
  inputSchema: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        description: 'ID of the delivery box to delete'
      },
      quiet: {
        type: 'boolean',
        description: 'Suppress process output and only display a machine-readable summary'
      },
      force: {
        type: 'boolean',
        description: 'Do not ask for confirmation'
      }
    },
    required: ['id']
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