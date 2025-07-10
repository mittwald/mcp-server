/**
 * @file Tool definition for mittwald_mail_address_get_cli
 * @module constants/tool/mittwald-cli/mail/address/get-cli
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../../types/tool-registry.js';
import { handleMittwaldMailAddressGetCli } from '../../../../../handlers/tools/mittwald-cli/mail/address/get-cli.js';

const tool: Tool = {
  name: 'mittwald_mail_address_get_cli',
  description: 'Get a specific mail address using Mittwald CLI',
  inputSchema: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        description: 'ID of the mail address to retrieve'
      },
      output: {
        type: 'string',
        enum: ['txt', 'json', 'yaml'],
        default: 'txt',
        description: 'Output format'
      }
    },
    required: ['id']
  }
};

const registration: ToolRegistration = {
  tool,
  handler: handleMittwaldMailAddressGetCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_mail_address_get_cli = tool;