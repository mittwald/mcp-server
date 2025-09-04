/**
 * @file Tool definition for mittwald_mail_address_delete_cli
 * @module constants/tool/mittwald-cli/mail/address/delete-cli
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../../types/tool-registry.js';
import { handleMittwaldMailAddressDeleteCli } from '../../../../../handlers/tools/mittwald-cli/mail/address/delete-cli.js';

const tool: Tool = {
  name: 'mittwald_mail_address_delete',
  title: 'Delete Mail Address',
  description: 'Delete a mail address.',
  inputSchema: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        description: 'ID of the mail address to delete'
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
  handler: handleMittwaldMailAddressDeleteCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_mail_address_delete_cli = tool;