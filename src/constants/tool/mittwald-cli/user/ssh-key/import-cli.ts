import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolRegistration } from '../../../../../types/tool-registry.js';
import { handleUserSshKeyImportCli } from '../../../../../handlers/tools/mittwald-cli/user/ssh-key/import-cli.js';

const tool: Tool = {
  name: 'mittwald_user_ssh_key_import',
  title: 'Import SSH Key',
  description: 'Import an existing (local) SSH key.. Imports an existing SSH public key from the local filesystem.',
  inputSchema: {
    type: 'object',
    properties: {
      expires: {
        type: 'string',
        description: 'An interval after which the SSH key expires (examples: 30m, 30d, 1y)'
      },
      input: {
        type: 'string',
        description: 'A filename in your ~/.ssh directory containing the key to import (default: id_rsa.pub)'
      }
    },
    additionalProperties: false
  }
};

// Export the tool registration
const registration: ToolRegistration = {
  tool,
  handler: handleUserSshKeyImportCli,
  schema: tool.inputSchema
};

export default registration;

// Legacy export for backwards compatibility
export const mittwald_user_ssh_key_import_cli = tool;