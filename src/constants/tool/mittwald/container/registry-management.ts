/**
 * Container Registry management tool definitions
 * 
 * @module constants/tool/mittwald/container/registry-management
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_container_create_registry: Tool = {
  name: "mittwald_container_create_registry",
  description: "Create a new container registry for a project",
  inputSchema: {
    type: "object",
    required: ["projectId", "imageRegistryType", "uri"],
    properties: {
      projectId: {
        type: "string",
        description: "The project ID to create the registry in",
      },
      imageRegistryType: {
        type: "string",
        enum: ["docker", "github", "gitlab"],
        description: "Type of container registry",
      },
      uri: {
        type: "string",
        description: "Registry URI (e.g., docker.io, ghcr.io, registry.gitlab.com)",
      },
      username: {
        type: "string",
        description: "Username for registry authentication (optional)",
      },
      password: {
        type: "string",
        description: "Password for registry authentication (optional)",
      },
    },
  },
  _meta: {
    title: "Create Container Registry",
    hidden: false,
    type: "server",
  },
};

export const mittwald_container_list_registries: Tool = {
  name: "mittwald_container_list_registries",
  description: "List all container registries belonging to a project",
  inputSchema: {
    type: "object",
    required: ["projectId"],
    properties: {
      projectId: {
        type: "string",
        description: "The project ID to list registries for",
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
    title: "List Container Registries",
    hidden: false,
    type: "server",
  },
};

export const mittwald_container_get_registry: Tool = {
  name: "mittwald_container_get_registry",
  description: "Get details of a specific container registry",
  inputSchema: {
    type: "object",
    required: ["registryId"],
    properties: {
      registryId: {
        type: "string",
        description: "The registry ID to retrieve",
      },
    },
  },
  _meta: {
    title: "Get Container Registry",
    hidden: false,
    type: "server",
  },
};

export const mittwald_container_update_registry: Tool = {
  name: "mittwald_container_update_registry",
  description: "Update a container registry configuration",
  inputSchema: {
    type: "object",
    required: ["registryId"],
    properties: {
      registryId: {
        type: "string",
        description: "The registry ID to update",
      },
      imageRegistryType: {
        type: "string",
        enum: ["docker", "github", "gitlab"],
        description: "New type of container registry",
      },
      uri: {
        type: "string",
        description: "New registry URI",
      },
      username: {
        type: "string",
        description: "New username for registry authentication",
      },
      password: {
        type: "string",
        description: "New password for registry authentication",
      },
    },
  },
  _meta: {
    title: "Update Container Registry",
    hidden: false,
    type: "server",
  },
};

export const mittwald_container_delete_registry: Tool = {
  name: "mittwald_container_delete_registry",
  description: "Delete a container registry",
  inputSchema: {
    type: "object",
    required: ["registryId"],
    properties: {
      registryId: {
        type: "string",
        description: "The registry ID to delete",
      },
    },
  },
  _meta: {
    title: "Delete Container Registry",
    hidden: false,
    type: "server",
  },
};

export const mittwald_container_validate_registry_uri: Tool = {
  name: "mittwald_container_validate_registry_uri",
  description: "Validate a container registry URI",
  inputSchema: {
    type: "object",
    required: ["uri"],
    properties: {
      uri: {
        type: "string",
        description: "The registry URI to validate",
      },
    },
  },
  _meta: {
    title: "Validate Registry URI",
    hidden: false,
    type: "server",
  },
};

export const mittwald_container_validate_registry_credentials: Tool = {
  name: "mittwald_container_validate_registry_credentials",
  description: "Validate credentials for a container registry",
  inputSchema: {
    type: "object",
    required: ["registryId"],
    properties: {
      registryId: {
        type: "string",
        description: "The registry ID to validate credentials for",
      },
    },
  },
  _meta: {
    title: "Validate Registry Credentials",
    hidden: false,
    type: "server",
  },
};