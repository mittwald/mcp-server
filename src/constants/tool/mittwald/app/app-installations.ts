import type { Tool } from '@modelcontextprotocol/sdk/types.js';

/**
 * Tool definitions for App Installation management operations
 * 
 * @module
 * This module contains tool definitions for managing app installations
 */

export const mittwald_app_installation_list: Tool = {
  name: "mittwald_app_installation_list",
  description: "List app installations within a project. Returns a list of all app installations with their current status, configuration, and metadata.",
  inputSchema: {
    type: "object",
    properties: {
      projectId: {
        type: "string",
        description: "The UUID of the project to list app installations for"
      },
      limit: {
        type: "number",
        description: "Maximum number of app installations to return",
        default: 100
      },
      skip: {
        type: "number",
        description: "Number of app installations to skip (for pagination)",
        default: 0
      }
    },
    required: ["projectId"]
  },
  _meta: {
    hidden: false,
    title: "List App Installations",
    type: "server"
  }
};

export const mittwald_app_installation_get: Tool = {
  name: "mittwald_app_installation_get",
  description: "Get detailed information about a specific app installation. Returns complete installation details including configuration, status, linked databases, and system software.",
  inputSchema: {
    type: "object",
    properties: {
      appInstallationId: {
        type: "string",
        description: "The UUID of the app installation to retrieve"
      }
    },
    required: ["appInstallationId"]
  },
  _meta: {
    hidden: false,
    title: "Get App Installation Details",
    type: "server"
  }
};

export const mittwald_app_installation_create: Tool = {
  name: "mittwald_app_installation_create",
  description: "Create a new app installation in a project. Installs an app with specified configuration, user inputs, and update policy.",
  inputSchema: {
    type: "object",
    properties: {
      appId: {
        type: "string",
        description: "The UUID of the app to install"
      },
      projectId: {
        type: "string",
        description: "The UUID of the project to install the app in"
      },
      description: {
        type: "string",
        description: "Human-readable description for this app installation"
      },
      appVersionId: {
        type: "string",
        description: "The UUID of the specific app version to install (optional, uses latest if not specified)"
      },
      updatePolicy: {
        type: "string",
        enum: ["none", "patchLevel", "all"],
        default: "patchLevel",
        description: "Automatic update policy for this installation"
      },
      userInputs: {
        type: "array",
        description: "Configuration values for app installation",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            value: { type: "string" }
          },
          required: ["name", "value"]
        }
      }
    },
    required: ["appId", "projectId", "description"]
  },
  _meta: {
    hidden: false,
    title: "Create App Installation",
    type: "server"
  }
};

export const mittwald_app_installation_update: Tool = {
  name: "mittwald_app_installation_update",
  description: "Update an existing app installation. Can modify description, update policy, app version, and configuration settings.",
  inputSchema: {
    type: "object",
    properties: {
      appInstallationId: {
        type: "string",
        description: "The UUID of the app installation to update"
      },
      description: {
        type: "string",
        description: "New description for the app installation"
      },
      appVersionId: {
        type: "string",
        description: "The UUID of the app version to update to"
      },
      updatePolicy: {
        type: "string",
        enum: ["none", "patchLevel", "all"],
        description: "New automatic update policy"
      },
      customDocumentRoot: {
        type: "string",
        description: "Custom document root path"
      },
      userInputs: {
        type: "array",
        description: "Updated configuration values",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            value: { type: "string" }
          },
          required: ["name", "value"]
        }
      }
    },
    required: ["appInstallationId"]
  },
  _meta: {
    hidden: false,
    title: "Update App Installation",
    type: "server"
  }
};

export const mittwald_app_installation_delete: Tool = {
  name: "mittwald_app_installation_delete",
  description: "Delete an app installation. This will permanently remove the app installation and all its data. Use with caution.",
  inputSchema: {
    type: "object",
    properties: {
      appInstallationId: {
        type: "string",
        description: "The UUID of the app installation to delete"
      }
    },
    required: ["appInstallationId"]
  },
  _meta: {
    hidden: false,
    title: "Delete App Installation",
    type: "server"
  }
};

export const mittwald_app_installation_listSuccessMessage = "Successfully retrieved app installations";
export const mittwald_app_installation_getSuccessMessage = "Successfully retrieved app installation details";
export const mittwald_app_installation_createSuccessMessage = "Successfully created app installation";
export const mittwald_app_installation_updateSuccessMessage = "Successfully updated app installation";
export const mittwald_app_installation_deleteSuccessMessage = "Successfully deleted app installation";