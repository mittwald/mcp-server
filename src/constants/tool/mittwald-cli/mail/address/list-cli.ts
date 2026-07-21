/**
 * @file Tool definition for mittwald_mail_address_list_cli
 * @module constants/tool/mittwald-cli/mail/address/list-cli
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../../types/tool-registry.js';
import { handleMittwaldMailAddressListCli } from '../../../../../handlers/tools/mittwald-cli/mail/address/list-cli.js';

const tool: Tool = {
  name: 'mittwald_mail_address_list',
  title: 'List Mail Addresses',
  annotations: {
    title: 'List Mail Addresses',
    readOnlyHint: true,
    destructiveHint: false,
  },
  description: 'List all mail addresses for a project.',
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
  handler: handleMittwaldMailAddressListCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_mail_address_list_cli = tool;