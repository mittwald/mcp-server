import { getMittwaldClient } from '../../../../services/mittwald/index.js';
import { formatToolResponse } from '../../types.js';

interface MySQLUserListArgs {
  mysqlDatabaseId: string;
  limit?: number;
  skip?: number;
}

export const handleMySQLUserList = async (args: MySQLUserListArgs) => {
  try {
    const client = getMittwaldClient();
    
    const response = await client.api.database.listMysqlUsers({
      mysqlDatabaseId: args.mysqlDatabaseId
    });

    if (response.status === 200) {
      return formatToolResponse({
        message: "Successfully retrieved MySQL users",
        result: response.data
      });
    }

    return formatToolResponse({
      status: "error",
      message: `Failed to list MySQL users: ${response.status}`,
      error: { type: "API_ERROR", details: response }
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to list MySQL users: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: { type: "API_ERROR", details: error }
    });
  }
};

interface MySQLUserCreateArgs {
  mysqlDatabaseId: string;
  description: string;
  password: string;
  accessLevel?: string;
  accessIpMask?: string;
  externalAccess?: boolean;
}

export const handleMySQLUserCreate = async (args: MySQLUserCreateArgs) => {
  try {
    const client = getMittwaldClient();
    
    const response = await client.api.database.createMysqlUser({
      mysqlDatabaseId: args.mysqlDatabaseId,
      data: {
        databaseId: args.mysqlDatabaseId,
        description: args.description,
        password: args.password,
        accessLevel: (args.accessLevel || 'full') as 'full' | 'readonly',
        externalAccess: args.externalAccess || false,
        accessIpMask: args.accessIpMask
      }
    });

    if (response.status === 201) {
      return formatToolResponse({
        message: "Successfully created MySQL user",
        result: response.data
      });
    }

    return formatToolResponse({
      status: "error",
      message: `Failed to create MySQL user: ${response.status}`,
      error: { type: "API_ERROR", details: response }
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to create MySQL user: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: { type: "API_ERROR", details: error }
    });
  }
};

interface MySQLUserGetArgs {
  mysqlUserId: string;
}

export const handleMySQLUserGet = async (args: MySQLUserGetArgs) => {
  try {
    const client = getMittwaldClient();
    
    const response = await client.api.database.getMysqlUser({
      mysqlUserId: args.mysqlUserId
    });

    if (response.status === 200) {
      return formatToolResponse({
        message: "Successfully retrieved MySQL user",
        result: response.data
      });
    }

    return formatToolResponse({
      status: "error",
      message: `Failed to get MySQL user: ${response.status}`,
      error: { type: "API_ERROR", details: response }
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to get MySQL user: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: { type: "API_ERROR", details: error }
    });
  }
};

interface MySQLUserUpdateArgs {
  mysqlUserId: string;
  description?: string;
  accessLevel?: string;
  accessIpMask?: string;
}

export const handleMySQLUserUpdate = async (args: MySQLUserUpdateArgs) => {
  try {
    const client = getMittwaldClient();
    
    const updateData: any = {};
    if (args.description !== undefined) updateData.description = args.description;
    if (args.accessLevel !== undefined) updateData.accessLevel = args.accessLevel;
    if (args.accessIpMask !== undefined) updateData.accessIpMask = args.accessIpMask;
    
    const response = await client.api.database.updateMysqlUser({
      mysqlUserId: args.mysqlUserId,
      data: updateData
    });

    if (response.status === 204) {
      return formatToolResponse({
        message: "Successfully updated MySQL user",
        result: { updated: true }
      });
    }

    return formatToolResponse({
      status: "error",
      message: `Failed to update MySQL user: ${response.status}`,
      error: { type: "API_ERROR", details: response }
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to update MySQL user: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: { type: "API_ERROR", details: error }
    });
  }
};

interface MySQLUserDeleteArgs {
  mysqlUserId: string;
}

export const handleMySQLUserDelete = async (args: MySQLUserDeleteArgs) => {
  try {
    const client = getMittwaldClient();
    
    const response = await client.api.database.deleteMysqlUser({
      mysqlUserId: args.mysqlUserId
    });

    if (response.status === 204) {
      return formatToolResponse({
        message: "Successfully deleted MySQL user",
        result: { deleted: true }
      });
    }

    return formatToolResponse({
      status: "error",
      message: `Failed to delete MySQL user: ${response.status}`,
      error: { type: "API_ERROR", details: response }
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to delete MySQL user: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: { type: "API_ERROR", details: error }
    });
  }
};

interface MySQLUserUpdatePasswordArgs {
  mysqlUserId: string;
  password: string;
}

export const handleMySQLUserUpdatePassword = async (args: MySQLUserUpdatePasswordArgs) => {
  try {
    const client = getMittwaldClient();
    
    const response = await client.api.database.updateMysqlUserPassword({
      mysqlUserId: args.mysqlUserId,
      data: {
        password: args.password
      }
    });

    if (response.status === 204) {
      return formatToolResponse({
        message: "Successfully updated MySQL user password",
        result: { updated: true }
      });
    }

    return formatToolResponse({
      status: "error",
      message: `Failed to update MySQL user password: ${response.status}`,
      error: { type: "API_ERROR", details: response }
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to update MySQL user password: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: { type: "API_ERROR", details: error }
    });
  }
};

interface MySQLUserEnableArgs {
  mysqlUserId: string;
}

export const handleMySQLUserEnable = async (args: MySQLUserEnableArgs) => {
  try {
    const client = getMittwaldClient();
    
    const response = await client.api.database.enableMysqlUser({
      mysqlUserId: args.mysqlUserId
    });

    if (response.status === 204) {
      return formatToolResponse({
        message: "Successfully enabled MySQL user",
        result: { enabled: true }
      });
    }

    return formatToolResponse({
      status: "error",
      message: `Failed to enable MySQL user: ${response.status}`,
      error: { type: "API_ERROR", details: response }
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to enable MySQL user: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: { type: "API_ERROR", details: error }
    });
  }
};

interface MySQLUserDisableArgs {
  mysqlUserId: string;
}

export const handleMySQLUserDisable = async (args: MySQLUserDisableArgs) => {
  try {
    const client = getMittwaldClient();
    
    const response = await client.api.database.disableMysqlUser({
      mysqlUserId: args.mysqlUserId
    });

    if (response.status === 204) {
      return formatToolResponse({
        message: "Successfully disabled MySQL user",
        result: { disabled: true }
      });
    }

    return formatToolResponse({
      status: "error",
      message: `Failed to disable MySQL user: ${response.status}`,
      error: { type: "API_ERROR", details: response }
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to disable MySQL user: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: { type: "API_ERROR", details: error }
    });
  }
};

interface MySQLUserGetPhpMyAdminUrlArgs {
  mysqlUserId: string;
}

export const handleMySQLUserGetPhpMyAdminUrl = async (args: MySQLUserGetPhpMyAdminUrlArgs) => {
  try {
    const client = getMittwaldClient();
    
    const response = await client.api.database.getMysqlUserPhpMyAdminUrl({
      mysqlUserId: args.mysqlUserId
    });

    if (response.status === 200) {
      return formatToolResponse({
        message: "Successfully retrieved phpMyAdmin URL",
        result: response.data
      });
    }

    return formatToolResponse({
      status: "error",
      message: `Failed to get phpMyAdmin URL: ${response.status}`,
      error: { type: "API_ERROR", details: response }
    });
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to get phpMyAdmin URL: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: { type: "API_ERROR", details: error }
    });
  }
};