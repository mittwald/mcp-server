import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_mysql_user_list: Tool = {
  name: "mittwald_mysql_user_list",
  description: "List all MySQL users for a database",
  inputSchema: {
    type: "object",
    properties: {
      mysqlDatabaseId: {
        type: "string",
        description: "The MySQL database ID to list users for"
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
    required: ["mysqlDatabaseId"]
  }
};

export const mittwald_mysql_user_create: Tool = {
  name: "mittwald_mysql_user_create",
  description: "Create a new MySQL user for a database",
  inputSchema: {
    type: "object",
    properties: {
      mysqlDatabaseId: {
        type: "string",
        description: "The MySQL database ID to create the user for"
      },
      description: {
        type: "string",
        description: "Description for the user"
      },
      password: {
        type: "string",
        description: "Password for the new user"
      },
      accessLevel: {
        type: "string",
        description: "Access level for the user (full or readonly)",
        enum: ["full", "readonly"]
      },
      accessIpMask: {
        type: "string",
        description: "IP mask for access restriction (optional)"
      },
      externalAccess: {
        type: "boolean",
        description: "Whether to allow external access"
      }
    },
    required: ["mysqlDatabaseId", "description", "password"]
  }
};

export const mittwald_mysql_user_get: Tool = {
  name: "mittwald_mysql_user_get",
  description: "Get details of a specific MySQL user",
  inputSchema: {
    type: "object",
    properties: {
      mysqlUserId: {
        type: "string",
        description: "The MySQL user ID"
      }
    },
    required: ["mysqlUserId"]
  }
};

export const mittwald_mysql_user_update: Tool = {
  name: "mittwald_mysql_user_update",
  description: "Update a MySQL user's configuration",
  inputSchema: {
    type: "object",
    properties: {
      mysqlUserId: {
        type: "string",
        description: "The MySQL user ID"
      },
      description: {
        type: "string",
        description: "New description for the user"
      },
      accessLevel: {
        type: "string",
        description: "New access level (full or readonly)",
        enum: ["full", "readonly"]
      },
      accessIpMask: {
        type: "string",
        description: "New IP mask for access restriction"
      }
    },
    required: ["mysqlUserId"]
  }
};

export const mittwald_mysql_user_delete: Tool = {
  name: "mittwald_mysql_user_delete",
  description: "Delete a MySQL user",
  inputSchema: {
    type: "object",
    properties: {
      mysqlUserId: {
        type: "string",
        description: "The MySQL user ID to delete"
      }
    },
    required: ["mysqlUserId"]
  }
};

export const mittwald_mysql_user_update_password: Tool = {
  name: "mittwald_mysql_user_update_password",
  description: "Update the password for a MySQL user",
  inputSchema: {
    type: "object",
    properties: {
      mysqlUserId: {
        type: "string",
        description: "The MySQL user ID"
      },
      password: {
        type: "string",
        description: "New password for the user"
      }
    },
    required: ["mysqlUserId", "password"]
  }
};

export const mittwald_mysql_user_enable: Tool = {
  name: "mittwald_mysql_user_enable",
  description: "Enable a disabled MySQL user",
  inputSchema: {
    type: "object",
    properties: {
      mysqlUserId: {
        type: "string",
        description: "The MySQL user ID to enable"
      }
    },
    required: ["mysqlUserId"]
  }
};

export const mittwald_mysql_user_disable: Tool = {
  name: "mittwald_mysql_user_disable",
  description: "Disable a MySQL user without deleting it",
  inputSchema: {
    type: "object",
    properties: {
      mysqlUserId: {
        type: "string",
        description: "The MySQL user ID to disable"
      }
    },
    required: ["mysqlUserId"]
  }
};

export const mittwald_mysql_user_get_phpmyadmin_url: Tool = {
  name: "mittwald_mysql_user_get_phpmyadmin_url",
  description: "Get the phpMyAdmin URL for a MySQL user",
  inputSchema: {
    type: "object",
    properties: {
      mysqlUserId: {
        type: "string",
        description: "The MySQL user ID"
      }
    },
    required: ["mysqlUserId"]
  }
};