import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const mittwald_mysql_database_list: Tool = {
  name: "mittwald_mysql_database_list",
  description: "List all MySQL databases for a project. Returns database IDs, names, descriptions, and other metadata.",
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

export const mittwald_mysql_database_create: Tool = {
  name: "mittwald_mysql_database_create",
  description: "Create a new MySQL database in a project",
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
      characterSettings: {
        type: "object",
        properties: {
          collation: {
            type: "string",
            description: "Database collation (e.g., utf8mb4_general_ci)"
          },
          characterSet: {
            type: "string",
            description: "Database character set (e.g., utf8mb4)"
          }
        }
      },
      version: {
        type: "string",
        description: "MySQL version to use"
      }
    },
    required: ["projectId", "description"]
  }
};

export const mittwald_mysql_database_get: Tool = {
  name: "mittwald_mysql_database_get",
  description: "Get details of a specific MySQL database",
  inputSchema: {
    type: "object",
    properties: {
      mysqlDatabaseId: {
        type: "string",
        description: "The MySQL database ID"
      }
    },
    required: ["mysqlDatabaseId"]
  }
};

export const mittwald_mysql_database_delete: Tool = {
  name: "mittwald_mysql_database_delete",
  description: "Delete a MySQL database",
  inputSchema: {
    type: "object",
    properties: {
      mysqlDatabaseId: {
        type: "string",
        description: "The MySQL database ID to delete"
      }
    },
    required: ["mysqlDatabaseId"]
  }
};

export const mittwald_mysql_database_update_description: Tool = {
  name: "mittwald_mysql_database_update_description",
  description: "Update the description of a MySQL database",
  inputSchema: {
    type: "object",
    properties: {
      mysqlDatabaseId: {
        type: "string",
        description: "The MySQL database ID"
      },
      description: {
        type: "string",
        description: "New description for the database"
      }
    },
    required: ["mysqlDatabaseId", "description"]
  }
};

export const mittwald_mysql_database_update_charset: Tool = {
  name: "mittwald_mysql_database_update_charset",
  description: "Update the default character set and collation of a MySQL database",
  inputSchema: {
    type: "object",
    properties: {
      mysqlDatabaseId: {
        type: "string",
        description: "The MySQL database ID"
      },
      defaultCharacterSet: {
        type: "string",
        description: "New default character set (e.g., utf8mb4)"
      },
      defaultCollation: {
        type: "string",
        description: "New default collation (e.g., utf8mb4_general_ci)"
      }
    },
    required: ["mysqlDatabaseId", "defaultCharacterSet", "defaultCollation"]
  }
};