import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_redis_database_list: Tool = {
  name: "mittwald_redis_database_list",
  description: "List all Redis databases for a project",
  inputSchema: {
    type: "object",
    properties: {
      projectId: {
        type: "string",
        description: "The project ID to list databases for"
      },
      limit: {
        type: "number",
        description: "Maximum number of results (for pagination)"
      },
      skip: {
        type: "number",
        description: "Number of results to skip (for pagination)"
      }
    },
    required: ["projectId"]
  }
};

export const mittwald_redis_database_create: Tool = {
  name: "mittwald_redis_database_create",
  description: "Create a new Redis database in a project",
  inputSchema: {
    type: "object",
    properties: {
      projectId: {
        type: "string",
        description: "The project ID to create the database in"
      },
      description: {
        type: "string",
        description: "Description for the database"
      },
      version: {
        type: "string",
        description: "Redis version to use"
      },
      configuration: {
        type: "object",
        description: "Redis configuration options",
        properties: {
          maxmemoryPolicy: {
            type: "string",
            description: "Eviction policy when max memory is reached",
            enum: ["noeviction", "allkeys-lru", "volatile-lru", "allkeys-random", "volatile-random", "volatile-ttl"]
          },
          maxMemory: {
            type: "string",
            description: "Maximum memory limit (e.g., '256mb', '1gb')"
          }
        }
      }
    },
    required: ["projectId", "description"]
  }
};

export const mittwald_redis_database_get: Tool = {
  name: "mittwald_redis_database_get",
  description: "Get details of a specific Redis database",
  inputSchema: {
    type: "object",
    properties: {
      redisDatabaseId: {
        type: "string",
        description: "The Redis database ID"
      }
    },
    required: ["redisDatabaseId"]
  }
};

export const mittwald_redis_database_delete: Tool = {
  name: "mittwald_redis_database_delete",
  description: "Delete a Redis database",
  inputSchema: {
    type: "object",
    properties: {
      redisDatabaseId: {
        type: "string",
        description: "The Redis database ID to delete"
      }
    },
    required: ["redisDatabaseId"]
  }
};

export const mittwald_redis_database_update_description: Tool = {
  name: "mittwald_redis_database_update_description",
  description: "Update the description of a Redis database",
  inputSchema: {
    type: "object",
    properties: {
      redisDatabaseId: {
        type: "string",
        description: "The Redis database ID"
      },
      description: {
        type: "string",
        description: "New description for the database"
      }
    },
    required: ["redisDatabaseId", "description"]
  }
};

export const mittwald_redis_database_update_configuration: Tool = {
  name: "mittwald_redis_database_update_configuration",
  description: "Update the configuration of a Redis database",
  inputSchema: {
    type: "object",
    properties: {
      redisDatabaseId: {
        type: "string",
        description: "The Redis database ID"
      },
      configuration: {
        type: "object",
        description: "Redis configuration options to update",
        properties: {
          maxmemoryPolicy: {
            type: "string",
            description: "Eviction policy when max memory is reached",
            enum: ["noeviction", "allkeys-lru", "volatile-lru", "allkeys-random", "volatile-random", "volatile-ttl"]
          },
          maxMemory: {
            type: "string",
            description: "Maximum memory limit (e.g., '256mb', '1gb')"
          },
          persistentStorage: {
            type: "boolean",
            description: "Enable persistent storage"
          }
        }
      }
    },
    required: ["redisDatabaseId", "configuration"]
  }
};

export const mittwald_redis_get_versions: Tool = {
  name: "mittwald_redis_get_versions",
  description: "Get available Redis versions",
  inputSchema: {
    type: "object",
    properties: {}
  }
};