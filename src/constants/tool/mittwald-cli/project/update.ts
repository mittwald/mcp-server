import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_project_update: Tool = {
  name: 'mittwald_project_update',
  description: 'Update an existing project. Allows updating the project description and other properties.',
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'ID or short ID of a project; this argument is optional if a default project is set in the context'
      },
      description: {
        type: 'string',
        description: 'Set the project description'
      },
      quiet: {
        type: 'boolean',
        description: 'Suppress process output and only display a machine-readable summary'
      }
    },
    required: [],
    additionalProperties: false
  }
};