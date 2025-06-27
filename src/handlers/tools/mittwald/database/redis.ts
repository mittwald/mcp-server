import { getMittwaldClient } from '../../../../services/mittwald/index.js';
import { formatToolResponse } from '../../types.js';

interface RedisDatabaseListArgs {
  projectId: string;
  limit?: number;
  skip?: number;
}

export const handleRedisDatabaseList = async (args: RedisDatabaseListArgs) => {
  try {
    const client = getMittwaldClient().api;
    
    const response = await client.database.listRedisDatabases({
      projectId: args.projectId
    });

    if (response.status === 200) {
      return formatToolResponse({
        message: "Successfully retrieved Redis databases",
        result: response.data
      });
    }

    return formatToolResponse({
      status: "error",
      message: `Failed to list Redis databases: ${response.status}`,
      error: { type: "API_ERROR", details: response }
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to list Redis databases: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: { type: "API_ERROR", details: error }
    });
  }
};

interface RedisDatabaseCreateArgs {
  projectId: string;
  description: string;
  version?: string;
  configuration?: {
    maxmemoryPolicy?: string;
    maxMemory?: string;
  };
}

export const handleRedisDatabaseCreate = async (args: RedisDatabaseCreateArgs) => {
  try {
    const client = getMittwaldClient().api;
    
    const response = await client.database.createRedisDatabase({
      data: {
        description: args.description,
        version: args.version || '7.0'
      },
      projectId: args.projectId
    });

    if (response.status === 201) {
      return formatToolResponse({
        message: "Successfully created Redis database",
        result: response.data
      });
    }

    return formatToolResponse({
      status: "error",
      message: `Failed to create Redis database: ${response.status}`,
      error: { type: "API_ERROR", details: response }
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to create Redis database: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: { type: "API_ERROR", details: error }
    });
  }
};

interface RedisDatabaseGetArgs {
  redisDatabaseId: string;
}

export const handleRedisDatabaseGet = async (args: RedisDatabaseGetArgs) => {
  try {
    const client = getMittwaldClient().api;
    
    const response = await client.database.getRedisDatabase({
      redisDatabaseId: args.redisDatabaseId
    });

    if (response.status === 200) {
      return formatToolResponse({
        message: "Successfully retrieved Redis database",
        result: response.data
      });
    }

    return formatToolResponse({
      status: "error",
      message: `Failed to get Redis database: ${response.status}`,
      error: { type: "API_ERROR", details: response }
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to get Redis database: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: { type: "API_ERROR", details: error }
    });
  }
};

interface RedisDatabaseDeleteArgs {
  redisDatabaseId: string;
}

export const handleRedisDatabaseDelete = async (args: RedisDatabaseDeleteArgs) => {
  try {
    const client = getMittwaldClient().api;
    
    const response = await client.database.deleteRedisDatabase({
      redisDatabaseId: args.redisDatabaseId
    });

    if (response.status === 204) {
      return formatToolResponse({
        message: "Successfully deleted Redis database",
        result: { deleted: true }
      });
    }

    return formatToolResponse({
      status: "error",
      message: `Failed to delete Redis database: ${response.status}`,
      error: { type: "API_ERROR", details: response }
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to delete Redis database: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: { type: "API_ERROR", details: error }
    });
  }
};

interface RedisDatabaseUpdateDescriptionArgs {
  redisDatabaseId: string;
  description: string;
}

export const handleRedisDatabaseUpdateDescription = async (args: RedisDatabaseUpdateDescriptionArgs) => {
  try {
    const client = getMittwaldClient().api;
    
    const response = await client.database.updateRedisDatabaseDescription({
      redisDatabaseId: args.redisDatabaseId,
      data: {
        description: args.description
      }
    });

    if (response.status === 204) {
      return formatToolResponse({
        message: "Successfully updated Redis database description",
        result: { updated: true }
      });
    }

    return formatToolResponse({
      status: "error",
      message: `Failed to update Redis database description: ${response.status}`,
      error: { type: "API_ERROR", details: response }
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to update Redis database description: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: { type: "API_ERROR", details: error }
    });
  }
};

interface RedisDatabaseUpdateConfigurationArgs {
  redisDatabaseId: string;
  configuration: {
    maxmemoryPolicy?: string;
    maxMemory?: string;
    persistentStorage?: boolean;
  };
}

export const handleRedisDatabaseUpdateConfiguration = async (args: RedisDatabaseUpdateConfigurationArgs) => {
  try {
    const client = getMittwaldClient().api;
    
    const configUpdate: any = {};
    if (args.configuration.maxmemoryPolicy) {
      configUpdate.maxMemoryPolicy = args.configuration.maxmemoryPolicy;
    }
    if (args.configuration.maxMemory) {
      configUpdate.maxMemory = args.configuration.maxMemory;
    }
    if (args.configuration.persistentStorage !== undefined) {
      configUpdate.persistent = args.configuration.persistentStorage;
    }
    
    const response = await client.database.updateRedisDatabaseConfiguration({
      redisDatabaseId: args.redisDatabaseId,
      data: {
        configuration: configUpdate
      }
    });

    if (response.status === 204) {
      return formatToolResponse({
        message: "Successfully updated Redis database configuration",
        result: { updated: true }
      });
    }

    return formatToolResponse({
      status: "error",
      message: `Failed to update Redis database configuration: ${response.status}`,
      error: { type: "API_ERROR", details: response }
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to update Redis database configuration: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: { type: "API_ERROR", details: error }
    });
  }
};

export const handleRedisGetVersions = async () => {
  try {
    const client = getMittwaldClient().api;
    
    const response = await client.database.listRedisVersions({});

    if (response.status === 200) {
      return formatToolResponse({
        message: "Successfully retrieved Redis versions",
        result: response.data
      });
    }

    return formatToolResponse({
      status: "error",
      message: `Failed to get Redis versions: ${response.status}`,
      error: { type: "API_ERROR", details: response }
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to get Redis versions: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: { type: "API_ERROR", details: error }
    });
  }
};