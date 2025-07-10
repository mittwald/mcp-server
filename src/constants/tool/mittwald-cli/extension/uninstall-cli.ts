import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_extension_uninstall_cli: Tool = {
  name: 'mittwald_extension_uninstall_cli',
  description: 'Remove an extension from an organization using CLI wrapper',
  inputSchema: {
    type: 'object',
    properties: {
      extensionInstanceId: {
        type: 'string',
        description: 'ID of the extension instance to uninstall'
      },
      quiet: {
        type: 'boolean',
        description: 'Suppress process output and only display a machine-readable summary'
      }
    },
    required: ['extensionInstanceId']
  }
};