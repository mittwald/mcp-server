/**
 * Container Service management tool definitions
 * 
 * @module constants/tool/mittwald/container/service-management
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_container_list_services: Tool = {
  name: "mittwald_container_list_services",
  description: "List all container services belonging to a project",
  inputSchema: {
    type: "object",
    required: ["projectId"],
    properties: {
      projectId: {
        type: "string",
        description: "The project ID to list services for",
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
    title: "List Container Services",
    hidden: false,
    type: "server",
  },
};

export const mittwald_container_get_service: Tool = {
  name: "mittwald_container_get_service",
  description: "Get details of a specific container service",
  inputSchema: {
    type: "object",
    required: ["stackId", "serviceId"],
    properties: {
      stackId: {
        type: "string",
        description: "The stack ID the service belongs to",
      },
      serviceId: {
        type: "string",
        description: "The service ID to retrieve",
      },
    },
  },
  _meta: {
    title: "Get Container Service",
    hidden: false,
    type: "server",
  },
};

export const mittwald_container_get_service_logs: Tool = {
  name: "mittwald_container_get_service_logs",
  description: "Get logs from a container service",
  inputSchema: {
    type: "object",
    required: ["stackId", "serviceId"],
    properties: {
      stackId: {
        type: "string",
        description: "The stack ID the service belongs to",
      },
      serviceId: {
        type: "string",
        description: "The service ID to get logs for",
      },
      since: {
        type: "string",
        description: "Start time for logs (RFC3339 format)",
      },
      until: {
        type: "string",
        description: "End time for logs (RFC3339 format)",
      },
      limit: {
        type: "integer",
        minimum: 1,
        maximum: 10000,
        default: 100,
        description: "Maximum number of log lines to return",
      },
    },
  },
  _meta: {
    title: "Get Service Logs",
    hidden: false,
    type: "server",
  },
};

export const mittwald_container_start_service: Tool = {
  name: "mittwald_container_start_service",
  description: "Start a stopped container service",
  inputSchema: {
    type: "object",
    required: ["stackId", "serviceId"],
    properties: {
      stackId: {
        type: "string",
        description: "The stack ID the service belongs to",
      },
      serviceId: {
        type: "string",
        description: "The service ID to start",
      },
    },
  },
  _meta: {
    title: "Start Container Service",
    hidden: false,
    type: "server",
  },
};

export const mittwald_container_stop_service: Tool = {
  name: "mittwald_container_stop_service",
  description: "Stop a running container service",
  inputSchema: {
    type: "object",
    required: ["stackId", "serviceId"],
    properties: {
      stackId: {
        type: "string",
        description: "The stack ID the service belongs to",
      },
      serviceId: {
        type: "string",
        description: "The service ID to stop",
      },
    },
  },
  _meta: {
    title: "Stop Container Service",
    hidden: false,
    type: "server",
  },
};

export const mittwald_container_restart_service: Tool = {
  name: "mittwald_container_restart_service",
  description: "Restart a running container service",
  inputSchema: {
    type: "object",
    required: ["stackId", "serviceId"],
    properties: {
      stackId: {
        type: "string",
        description: "The stack ID the service belongs to",
      },
      serviceId: {
        type: "string",
        description: "The service ID to restart",
      },
    },
  },
  _meta: {
    title: "Restart Container Service",
    hidden: false,
    type: "server",
  },
};

export const mittwald_container_recreate_service: Tool = {
  name: "mittwald_container_recreate_service",
  description: "Recreate a container service (stop and start with new container)",
  inputSchema: {
    type: "object",
    required: ["stackId", "serviceId"],
    properties: {
      stackId: {
        type: "string",
        description: "The stack ID the service belongs to",
      },
      serviceId: {
        type: "string",
        description: "The service ID to recreate",
      },
    },
  },
  _meta: {
    title: "Recreate Container Service",
    hidden: false,
    type: "server",
  },
};

export const mittwald_container_pull_image_for_service: Tool = {
  name: "mittwald_container_pull_image_for_service",
  description: "Pull the latest version of a service's image and recreate the service",
  inputSchema: {
    type: "object",
    required: ["stackId", "serviceId"],
    properties: {
      stackId: {
        type: "string",
        description: "The stack ID the service belongs to",
      },
      serviceId: {
        type: "string",
        description: "The service ID to pull image and recreate",
      },
    },
  },
  _meta: {
    title: "Pull Image and Recreate Service",
    hidden: false,
    type: "server",
  },
};