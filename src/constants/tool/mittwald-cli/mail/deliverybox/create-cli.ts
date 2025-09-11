/**
 * @file Tool definition for mittwald_mail_deliverybox_create_cli
 * @module constants/tool/mittwald-cli/mail/deliverybox/create-cli
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../../types/tool-registry.js';
import { handleMittwaldMailDeliveryboxCreateCli } from '../../../../../handlers/tools/mittwald-cli/mail/deliverybox/create-cli.js';

const tool: Tool = {
  name: 'mittwald_mail_deliverybox_create',
  title: 'Create Delivery Box',
  description: 'Create a new delivery box.',
  inputSchema: {
    type: 'object',
    properties: {
      description: {
        type: 'string',
        description: 'Description for the delivery box'
      },
      projectId: {
        type: 'string',
        description: 'ID or short ID of a project; this flag is optional if a default project is set in the context'
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
    required: ["description", "projectId"]
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleMittwaldMailDeliveryboxCreateCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_mail_deliverybox_create_cli = tool;