import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_extension_install_cli: Tool = {
  name: 'mittwald_extension_install_cli',
  description: 'Install an extension in a project or organization using CLI wrapper',
  inputSchema: {
    type: 'object',
    properties: {
      extensionId: {
        type: 'string',
        description: 'ID of the extension to install'
      },
      projectId: {
        type: 'string',
        description: 'ID of the project to install the extension in'
      },
      orgId: {
        type: 'string',
        description: 'ID of the organization to install the extension in'
      },
      quiet: {
        type: 'boolean',
        description: 'Suppress process output and only display a machine-readable summary'
      },
      consent: {
        type: 'boolean',
        description: 'Consent to the extension having access to the requested scopes'
      }
    },
    required: ['extensionId']
  }
};