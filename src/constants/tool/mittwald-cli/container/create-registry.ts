import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_container_create_registry: Tool = {
  name: 'mittwald_container_create_registry',
  description: 'Create a container registry for pulling private images',
  inputSchema: {
    type: 'object',
    properties: {
      projectId: {
        type: 'string',
        description: 'ID or short ID of a project'
      },
      uri: {
        type: 'string',
        description: 'Registry URI (e.g., docker.io, ghcr.io, registry.gitlab.com)'
      },
      imageRegistryType: {
        type: 'string',
        enum: ['docker', 'github', 'gitlab', 'custom'],
        description: 'Type of registry (default: custom)'
      },
      username: {
        type: 'string',
        description: 'Registry username for authentication'
      },
      password: {
        type: 'string',
        description: 'Registry password or token for authentication'
      }
    },
    required: ['projectId', 'uri']
  }
};