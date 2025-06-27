/**
 * Container Volume and Config management tool definitions
 * 
 * @module constants/tool/mittwald/container/volume-config-management
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_container_list_volumes: Tool = {
  name: "mittwald_container_list_volumes",
  description: "List all container volumes belonging to a project",
  inputSchema: {
    type: "object",
    required: ["projectId"],
    properties: {
      projectId: {
        type: "string",
        description: "The project ID to list volumes for",
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
    title: "List Container Volumes",
    hidden: false,
    type: "server",
  },
};

export const mittwald_container_get_volume: Tool = {
  name: "mittwald_container_get_volume",
  description: "Get details of a specific container volume",
  inputSchema: {
    type: "object",
    required: ["stackId", "volumeId"],
    properties: {
      stackId: {
        type: "string",
        description: "The stack ID the volume belongs to",
      },
      volumeId: {
        type: "string",
        description: "The volume ID to retrieve",
      },
    },
  },
  _meta: {
    title: "Get Container Volume",
    hidden: false,
    type: "server",
  },
};

export const mittwald_container_delete_volume: Tool = {
  name: "mittwald_container_delete_volume",
  description: "Delete a container volume from a stack",
  inputSchema: {
    type: "object",
    required: ["stackId", "volumeId"],
    properties: {
      stackId: {
        type: "string",
        description: "The stack ID the volume belongs to",
      },
      volumeId: {
        type: "string",
        description: "The volume ID to delete",
      },
    },
  },
  _meta: {
    title: "Delete Container Volume",
    hidden: false,
    type: "server",
  },
};

export const mittwald_container_get_container_image_config: Tool = {
  name: "mittwald_container_get_container_image_config",
  description: "Get container image configuration details",
  inputSchema: {
    type: "object",
    properties: {
      // This endpoint doesn't require any parameters based on the OpenAPI spec
    },
  },
  _meta: {
    title: "Get Container Image Config",
    hidden: false,
    type: "server",
  },
};