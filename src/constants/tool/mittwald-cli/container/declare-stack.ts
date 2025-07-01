import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_container_declare_stack: Tool = {
  name: 'mittwald_container_declare_stack',
  description: `Declaratively create, update or delete services or volumes belonging to a stack. This is idempotent - services/volumes not in the declaration will be removed.

IMPORTANT: Each service MUST have:
- imageUri: The container image (required)
- ports: Array of port mappings (required, use empty array [] if no ports needed)

Example:
{
  "stackId": "uuid-here",
  "desiredServices": {
    "nginx": {
      "imageUri": "nginx:alpine",
      "description": "Web server",
      "ports": [{"containerPort": 80, "protocol": "tcp"}],
      "environment": {"NGINX_HOST": "localhost"}
    },
    "hello": {
      "imageUri": "hello-world:latest",
      "description": "Hello world",
      "ports": [],  // Required even if empty!
      "environment": {"MESSAGE": "Hello"}
    }
  }
}`,
  inputSchema: {
    type: 'object',
    properties: {
      stackId: {
        type: 'string',
        description: 'UUID of the stack to update. Use mittwald_container_list_stacks to find stack IDs for a project.'
      },
      desiredServices: {
        type: 'object',
        description: 'Map of service names to service configurations',
        additionalProperties: {
          type: 'object',
          properties: {
            imageUri: {
              type: 'string',
              description: 'Container image URI (e.g., nginx:latest, ghcr.io/org/image:tag, n8nio/n8n, postgres)'
            },
            description: {
              type: 'string',
              description: 'Description for the service (optional, defaults to service name + " container")'
            },
            environment: {
              type: 'object',
              description: 'Environment variables as key-value pairs',
              additionalProperties: {
                type: 'string'
              }
            },
            command: {
              type: 'array',
              description: 'Command arguments to pass to the entrypoint',
              items: {
                type: 'string'
              }
            },
            entrypoint: {
              type: 'array',
              description: 'Container entrypoint (e.g., ["tini", "--", "/docker-entrypoint.sh"])',
              items: {
                type: 'string'
              }
            },
            ports: {
              type: 'array',
              description: 'Port mappings (required field - use empty array [] if no ports needed)',
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
          required: ['imageUri', 'ports']
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