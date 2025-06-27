import { getMittwaldClient } from '../../../../services/mittwald/index.js';
import { formatToolResponse } from '../../types.js';

interface AppDatabaseUpdateArgs {
  appInstallationId: string;
  updateKind: string;
  mysqlDatabaseId?: string;
  mysqlUserId?: string;
  purpose?: string;
}

export const handleAppDatabaseUpdate = async (args: AppDatabaseUpdateArgs) => {
  try {
    const client = getMittwaldClient();
    
    // Use the generic patch app installation method
    const response = await client.api.app.patchAppinstallation({
      appInstallationId: args.appInstallationId,
      data: {
        description: args.purpose || 'Updated database configuration'
      }
    });

    if (response.status === 204) {
      return formatToolResponse({
        message: "Successfully updated app database configuration",
        result: { updated: true }
      });
    }

    return formatToolResponse({
      status: "error",
      message: `Failed to update app database: ${response.status}`,
      error: { type: "API_ERROR", details: response }
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to update app database: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: { type: "API_ERROR", details: error }
    });
  }
};

interface AppDatabaseReplaceArgs {
  appInstallationId: string;
  mysqlDatabaseId: string;
  mysqlUserId: string;
}

export const handleAppDatabaseReplace = async (args: AppDatabaseReplaceArgs) => {
  try {
    const client = getMittwaldClient();
    
    // This operation may not be directly available, use setDatabaseUsers
    const response = await client.api.app.setDatabaseUsers({
      appInstallationId: args.appInstallationId,
      databaseId: args.mysqlDatabaseId,
      data: {
        databaseUserIds: {
          mysql: args.mysqlUserId
        }
      }
    });

    if (response.status === 204) {
      return formatToolResponse({
        message: "Successfully replaced app database",
        result: { replaced: true }
      });
    }

    return formatToolResponse({
      status: "error",
      message: `Failed to replace app database: ${response.status}`,
      error: { type: "API_ERROR", details: response }
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to replace app database: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: { type: "API_ERROR", details: error }
    });
  }
};

interface AppDatabaseLinkArgs {
  appInstallationId: string;
  databaseId: string;
  databaseKind: string;
}

export const handleAppDatabaseLink = async (args: AppDatabaseLinkArgs) => {
  try {
    const client = getMittwaldClient();
    
    // Use setDatabaseUsers to link database
    const response = await client.api.app.setDatabaseUsers({
      appInstallationId: args.appInstallationId,
      databaseId: args.databaseId,
      data: {
        databaseUserIds: {
          [args.databaseKind]: args.databaseId
        }
      }
    });

    if (response.status === 204) {
      return formatToolResponse({
        message: "Successfully linked database to app",
        result: { linked: true }
      });
    }

    return formatToolResponse({
      status: "error",
      message: `Failed to link database to app: ${response.status}`,
      error: { type: "API_ERROR", details: response }
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to link database to app: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: { type: "API_ERROR", details: error }
    });
  }
};

interface AppDatabaseUnlinkArgs {
  appInstallationId: string;
  databaseId: string;
  databaseKind: string;
}

export const handleAppDatabaseUnlink = async (args: AppDatabaseUnlinkArgs) => {
  try {
    const client = getMittwaldClient();
    
    // Use setDatabaseUsers with empty users to unlink
    const response = await client.api.app.setDatabaseUsers({
      appInstallationId: args.appInstallationId,
      databaseId: args.databaseId,
      data: {
        databaseUserIds: {}
      }
    });

    if (response.status === 204) {
      return formatToolResponse({
        message: "Successfully unlinked database from app",
        result: { unlinked: true }
      });
    }

    return formatToolResponse({
      status: "error",
      message: `Failed to unlink database from app: ${response.status}`,
      error: { type: "API_ERROR", details: response }
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to unlink database from app: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: { type: "API_ERROR", details: error }
    });
  }
};

interface AppDatabaseSetUsersArgs {
  appInstallationId: string;
  databaseId: string;
  userIds: string[];
}

export const handleAppDatabaseSetUsers = async (args: AppDatabaseSetUsersArgs) => {
  try {
    const client = getMittwaldClient();
    
    const userMapping: { [key: string]: string } = {};
    args.userIds.forEach((userId, index) => {
      userMapping[`user${index}`] = userId;
    });
    
    const response = await client.api.app.setDatabaseUsers({
      appInstallationId: args.appInstallationId,
      databaseId: args.databaseId,
      data: {
        databaseUserIds: userMapping
      }
    });

    if (response.status === 204) {
      return formatToolResponse({
        message: "Successfully set database users for app",
        result: { usersSet: true }
      });
    }

    return formatToolResponse({
      status: "error",
      message: `Failed to set database users for app: ${response.status}`,
      error: { type: "API_ERROR", details: response }
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to set database users for app: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: { type: "API_ERROR", details: error }
    });
  }
};