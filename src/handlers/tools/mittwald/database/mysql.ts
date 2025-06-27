import { getMittwaldClient } from '../../../../services/mittwald/index.js';
import { formatToolResponse } from '../../types.js';

interface MySQLDatabaseListArgs {
  projectId: string;
  limit?: number;
  skip?: number;
}

export const handleMySQLDatabaseList = async (args: MySQLDatabaseListArgs) => {
  try {
    const client = getMittwaldClient().api;
    
    const response = await client.database.listMysqlDatabases({
      projectId: args.projectId
    });

    if (response.status === 200) {
      return formatToolResponse({
        message: "Successfully retrieved MySQL databases",
        result: response.data
      });
    }

    return formatToolResponse({
      status: "error",
      message: `Failed to list MySQL databases: ${response.status}`,
      error: { type: "API_ERROR", details: response }
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to list MySQL databases: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: { type: "API_ERROR", details: error }
    });
  }
};

interface MySQLDatabaseCreateArgs {
  projectId: string;
  description: string;
  characterSettings?: {
    collation?: string;
    characterSet?: string;
  };
  version?: string;
}

export const handleMySQLDatabaseCreate = async (args: MySQLDatabaseCreateArgs) => {
  try {
    const client = getMittwaldClient().api;
    
    const response = await client.database.createMysqlDatabase({
      projectId: args.projectId,
      data: {
        database: {
          projectId: args.projectId,
          description: args.description,
          characterSettings: args.characterSettings ? {
            characterSet: args.characterSettings.characterSet!,
            collation: args.characterSettings.collation!
          } : undefined,
          version: args.version || '8.0'
        },
        user: {
          accessLevel: 'full' as const,
          password: 'temp-' + Math.random().toString(36).substring(7)
        }
      }
    });

    if (response.status === 201) {
      return formatToolResponse({
        message: "Successfully created MySQL database",
        result: response.data
      });
    }

    return formatToolResponse({
      status: "error",
      message: `Failed to create MySQL database: ${response.status}`,
      error: { type: "API_ERROR", details: response }
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to create MySQL database: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: { type: "API_ERROR", details: error }
    });
  }
};

interface MySQLDatabaseGetArgs {
  mysqlDatabaseId: string;
}

export const handleMySQLDatabaseGet = async (args: MySQLDatabaseGetArgs) => {
  try {
    const client = getMittwaldClient().api;
    
    const response = await client.database.getMysqlDatabase({
      mysqlDatabaseId: args.mysqlDatabaseId
    });

    if (response.status === 200) {
      return formatToolResponse({
        message: "Successfully retrieved MySQL database",
        result: response.data
      });
    }

    return formatToolResponse({
      status: "error",
      message: `Failed to get MySQL database: ${response.status}`,
      error: { type: "API_ERROR", details: response }
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to get MySQL database: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: { type: "API_ERROR", details: error }
    });
  }
};

interface MySQLDatabaseDeleteArgs {
  mysqlDatabaseId: string;
}

export const handleMySQLDatabaseDelete = async (args: MySQLDatabaseDeleteArgs) => {
  try {
    const client = getMittwaldClient().api;
    
    const response = await client.database.deleteMysqlDatabase({
      mysqlDatabaseId: args.mysqlDatabaseId
    });

    if (response.status === 204) {
      return formatToolResponse({
        message: "Successfully deleted MySQL database",
        result: { deleted: true }
      });
    }

    return formatToolResponse({
      status: "error",
      message: `Failed to delete MySQL database: ${response.status}`,
      error: { type: "API_ERROR", details: response }
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to delete MySQL database: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: { type: "API_ERROR", details: error }
    });
  }
};

interface MySQLDatabaseUpdateDescriptionArgs {
  mysqlDatabaseId: string;
  description: string;
}

export const handleMySQLDatabaseUpdateDescription = async (args: MySQLDatabaseUpdateDescriptionArgs) => {
  try {
    const client = getMittwaldClient().api;
    
    const response = await client.database.updateMysqlDatabaseDescription({
      mysqlDatabaseId: args.mysqlDatabaseId,
      data: {
        description: args.description
      }
    });

    if (response.status === 204) {
      return formatToolResponse({
        message: "Successfully updated MySQL database description",
        result: { updated: true }
      });
    }

    return formatToolResponse({
      status: "error",
      message: `Failed to update MySQL database description: ${response.status}`,
      error: { type: "API_ERROR", details: response }
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to update MySQL database description: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: { type: "API_ERROR", details: error }
    });
  }
};

interface MySQLDatabaseUpdateCharsetArgs {
  mysqlDatabaseId: string;
  defaultCharacterSet: string;
  defaultCollation: string;
}

export const handleMySQLDatabaseUpdateCharset = async (args: MySQLDatabaseUpdateCharsetArgs) => {
  try {
    const client = getMittwaldClient().api;
    
    const response = await client.database.updateMysqlDatabaseDefaultCharset({
      mysqlDatabaseId: args.mysqlDatabaseId,
      data: {
        characterSettings: {
          characterSet: args.defaultCharacterSet,
          collation: args.defaultCollation
        }
      }
    });

    if (response.status === 204) {
      return formatToolResponse({
        message: "Successfully updated MySQL database character set",
        result: { updated: true }
      });
    }

    return formatToolResponse({
      status: "error",
      message: `Failed to update MySQL database character set: ${response.status}`,
      error: { type: "API_ERROR", details: response }
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to update MySQL database character set: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: { type: "API_ERROR", details: error }
    });
  }
};