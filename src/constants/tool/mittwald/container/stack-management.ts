/**
 * Container Stack management tool definitions
 * 
 * @module constants/tool/mittwald/container/stack-management
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_container_list_stacks: Tool = {
  name: "mittwald_container_list_stacks",
  description: "List all container stacks belonging to a project",
  inputSchema: {
    type: "object",
    required: ["projectId"],
    properties: {
      projectId: {
        type: "string",
        description: "The project ID to list stacks for",
      },
      limit: {
        type: "integer",
        minimum: 1,
        maximum: 1000,
        default: 100,
        description: "Maximum number of results to return",
      },
      skip: {
        type: "integer",
        minimum: 0,
        default: 0,
        description: "Number of results to skip for pagination",
      },
      page: {
        type: "integer",
        minimum: 1,
        description: "Page number for pagination (alternative to skip)",
      },
    },
  },
  _meta: {
    title: "List Container Stacks",
    hidden: false,
    type: "server",
  },
};

export const mittwald_container_get_stack: Tool = {
  name: "mittwald_container_get_stack",
  description: "Get details of a specific container stack",
  inputSchema: {
    type: "object",
    required: ["stackId"],
    properties: {
      stackId: {
        type: "string",
        description: "The stack ID to retrieve",
      },
    },
  },
  _meta: {
    title: "Get Container Stack",
    hidden: false,
    type: "server",
  },
};

export const mittwald_container_update_stack: Tool = {
  name: "mittwald_container_update_stack",
  description: "Create, update or delete services or volumes belonging to a stack",
  inputSchema: {
    type: "object",
    required: ["stackId"],
    properties: {
      stackId: {
        type: "string",
        description: "The stack ID to update",
      },
      services: {
        type: "array",
        description: "Services to create or update in the stack",
        items: {
          type: "object",
          required: ["name"],
          properties: {
            name: {
              type: "string",
              description: "Service name",
            },
            imageURI: {
              type: "string",
              description: "Docker image URI",
            },
            environment: {
              type: "object",
              description: "Environment variables as key-value pairs",
              additionalProperties: {
                type: "string",
              },
            },
            ports: {
              type: "array",
              description: "Port mappings",
              items: {
                type: "object",
                required: ["containerPort"],
                properties: {
                  containerPort: {
                    type: "integer",
                    description: "Container port number",
                  },
                  protocol: {
                    type: "string",
                    enum: ["tcp", "udp"],
                    default: "tcp",
                    description: "Protocol for the port",
                  },
                },
              },
            },
            volumes: {
              type: "array",
              description: "Volume mounts",
              items: {
                type: "object",
                required: ["name", "mountPath"],
                properties: {
                  name: {
                    type: "string",
                    description: "Volume name",
                  },
                  mountPath: {
                    type: "string",
                    description: "Mount path in container",
                  },
                  readOnly: {
                    type: "boolean",
                    default: false,
                    description: "Whether volume is read-only",
                  },
                },
              },
            },
          },
        },
      },
      volumes: {
        type: "array",
        description: "Volumes to create or update in the stack",
        items: {
          type: "object",
          required: ["name"],
          properties: {
            name: {
              type: "string",
              description: "Volume name",
            },
            size: {
              type: "string",
              description: "Volume size (e.g., '10Gi')",
            },
          },
        },
      },
    },
  },
  _meta: {
    title: "Update Container Stack",
    hidden: false,
    type: "server",
  },
};

export const mittwald_container_declare_stack: Tool = {
  name: "mittwald_container_declare_stack",
  description: "Declaratively create, update or delete services or volumes belonging to a stack",
  inputSchema: {
    type: "object",
    required: ["stackId"],
    properties: {
      stackId: {
        type: "string",
        description: "The stack ID to declare",
      },
      desiredServices: {
        type: "array",
        description: "Complete list of desired services (replaces existing services)",
        items: {
          type: "object",
          required: ["name", "imageURI"],
          properties: {
            name: {
              type: "string",
              description: "Service name",
            },
            imageURI: {
              type: "string",
              description: "Docker image URI",
            },
            environment: {
              type: "object",
              description: "Environment variables as key-value pairs",
              additionalProperties: {
                type: "string",
              },
            },
            ports: {
              type: "array",
              description: "Port mappings",
              items: {
                type: "object",
                required: ["containerPort"],
                properties: {
                  containerPort: {
                    type: "integer",
                    description: "Container port number",
                  },
                  protocol: {
                    type: "string",
                    enum: ["tcp", "udp"],
                    default: "tcp",
                    description: "Protocol for the port",
                  },
                },
              },
            },
            volumes: {
              type: "array",
              description: "Volume mounts",
              items: {
                type: "object",
                required: ["name", "mountPath"],
                properties: {
                  name: {
                    type: "string",
                    description: "Volume name",
                  },
                  mountPath: {
                    type: "string",
                    description: "Mount path in container",
                  },
                  readOnly: {
                    type: "boolean",
                    default: false,
                    description: "Whether volume is read-only",
                  },
                },
              },
            },
          },
        },
      },
      desiredVolumes: {
        type: "array",
        description: "Complete list of desired volumes (replaces existing volumes)",
        items: {
          type: "object",
          required: ["name"],
          properties: {
            name: {
              type: "string",
              description: "Volume name",
            },
            size: {
              type: "string",
              description: "Volume size (e.g., '10Gi')",
            },
          },
        },
      },
    },
  },
  _meta: {
    title: "Declare Container Stack",
    hidden: false,
    type: "server",
  },
};