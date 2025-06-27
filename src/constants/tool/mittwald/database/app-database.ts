import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_app_database_update: Tool = {
  name: "mittwald_app_database_update",
  description: "Update the database configuration for an app installation",
  inputSchema: {
    type: "object",
    properties: {
      appInstallationId: {
        type: "string",
        description: "The app installation ID"
      },
      updateKind: {
        type: "string",
        description: "The kind of update operation",
        enum: ["update", "replace", "unlink", "link"]
      },
      mysqlDatabaseId: {
        type: "string",
        description: "The MySQL database ID to link"
      },
      mysqlUserId: {
        type: "string",
        description: "The MySQL user ID to use"
      },
      purpose: {
        type: "string",
        description: "The purpose of the database connection (e.g., 'primary', 'cache')"
      }
    },
    required: ["appInstallationId", "updateKind"]
  }
};

export const mittwald_app_database_replace: Tool = {
  name: "mittwald_app_database_replace",
  description: "Replace the database for an app installation",
  inputSchema: {
    type: "object",
    properties: {
      appInstallationId: {
        type: "string",
        description: "The app installation ID"
      },
      mysqlDatabaseId: {
        type: "string",
        description: "The new MySQL database ID"
      },
      mysqlUserId: {
        type: "string",
        description: "The MySQL user ID to use"
      }
    },
    required: ["appInstallationId", "mysqlDatabaseId", "mysqlUserId"]
  }
};

export const mittwald_app_database_link: Tool = {
  name: "mittwald_app_database_link",
  description: "Link a database to an app installation",
  inputSchema: {
    type: "object",
    properties: {
      appInstallationId: {
        type: "string",
        description: "The app installation ID"
      },
      databaseId: {
        type: "string",
        description: "The database ID to link"
      },
      databaseKind: {
        type: "string",
        description: "The kind of database (mysql or redis)",
        enum: ["mysql", "redis"]
      }
    },
    required: ["appInstallationId", "databaseId", "databaseKind"]
  }
};

export const mittwald_app_database_unlink: Tool = {
  name: "mittwald_app_database_unlink",
  description: "Unlink a database from an app installation",
  inputSchema: {
    type: "object",
    properties: {
      appInstallationId: {
        type: "string",
        description: "The app installation ID"
      },
      databaseId: {
        type: "string",
        description: "The database ID to unlink"
      },
      databaseKind: {
        type: "string",
        description: "The kind of database (mysql or redis)",
        enum: ["mysql", "redis"]
      }
    },
    required: ["appInstallationId", "databaseId", "databaseKind"]
  }
};

export const mittwald_app_database_set_users: Tool = {
  name: "mittwald_app_database_set_users",
  description: "Set database users for an app installation",
  inputSchema: {
    type: "object",
    properties: {
      appInstallationId: {
        type: "string",
        description: "The app installation ID"
      },
      databaseId: {
        type: "string",
        description: "The database ID"
      },
      userIds: {
        type: "array",
        items: {
          type: "string"
        },
        description: "Array of database user IDs to set"
      }
    },
    required: ["appInstallationId", "databaseId", "userIds"]
  }
};