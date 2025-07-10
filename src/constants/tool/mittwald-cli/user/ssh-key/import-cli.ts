import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_user_ssh_key_import_cli: Tool = {
  name: 'mittwald_user_ssh_key_import_cli',
  description: 'Import an existing (local) SSH key using CLI wrapper. Imports an existing SSH public key from the local filesystem.',
  inputSchema: {
    type: 'object',
    properties: {
      quiet: {
        type: 'boolean',
        description: 'Suppress process output and only display a machine-readable summary'
      },
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