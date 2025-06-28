import { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_app_dependency_update: Tool = {
  name: 'mittwald_app_dependency_update',
  description: 'Update the dependencies of an app',
  inputSchema: {
    type: 'object',
    properties: {
      installation_id: {
        type: 'string',
        description: 'ID or short ID of an app installation; this argument is optional if a default app installation is set in the context',
      },
      set: {
        type: 'array',
        items: {
          type: 'string',
        },
        description: 'Set a dependency to a specific version. Format: <dependency>=<version>',
        minItems: 1,
      },
      update_policy: {
        type: 'string',
        enum: ['none', 'inheritedFromApp', 'patchLevel', 'all'],
        description: 'Set the update policy for the configured dependencies',
        default: 'patchLevel',
      },
      quiet: {
        type: 'boolean',
        description: 'Suppress process output and only display a machine-readable summary',
        default: false,
      },
    },
    required: ['set'],
  },
};