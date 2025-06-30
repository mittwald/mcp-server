import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_container_declare_stack: Tool = {
  name: 'mittwald_container_declare_stack',
  description: 'Declaratively create, update or delete services or volumes belonging to a stack. This is idempotent - services/volumes not in the declaration will be removed.',
  inputSchema: {
    type: 'object',
    properties: {
      stackId: {
        type: 'string',
        description: 'ID of the stack to update'
      },
      desiredServices: {
        type: 'object',
        description: 'Map of service names to service configurations',
        additionalProperties: {
          type: 'object',
          properties: {
            imageUri: {
              type: 'string',
              description: 'Container image URI (e.g., nginx:latest, ghcr.io/org/image:tag)'
            },
            environment: {
              type: 'object',
              description: 'Environment variables as key-value pairs',
              additionalProperties: {
                type: 'string'
              }
            },
            ports: {
              type: 'array',
              description: 'Port mappings',
              items: {
                type: 'object',
                properties: {
                  containerPort: {
                    type: 'number',
                    description: 'Port inside the container'
                  },
                  protocol: {
                    type: 'string',
                    enum: ['tcp', 'udp'],
                    description: 'Protocol (default: tcp)'
                  }
                },
                required: ['containerPort']
              }
            },
            volumes: {
              type: 'array',
              description: 'Volume mounts',
              items: {
                type: 'object',
                properties: {
                  name: {
                    type: 'string',
                    description: 'Volume name or absolute path for project volume'
                  },
                  mountPath: {
                    type: 'string',
                    description: 'Mount path inside the container'
                  },
                  readOnly: {
                    type: 'boolean',
                    description: 'Mount as read-only (default: false)'
                  }
                },
                required: ['name', 'mountPath']
              }
            }
          },
          required: ['imageUri']
        }
      },
      desiredVolumes: {
        type: 'object',
        description: 'Map of volume names to volume configurations',
        additionalProperties: {
          type: 'object',
          properties: {
            size: {
              type: 'string',
              description: 'Volume size (e.g., 1Gi, 500Mi)'
            }
          }
        }
      }
    },
    required: ['stackId']
  }
};