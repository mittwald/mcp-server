import type { Tool } from '@modelcontextprotocol/sdk/types.js';

/**
 * Tool definitions for App Installation action operations
 * 
 * @module
 * This module contains tool definitions for performing actions on app installations
 */

export const mittwald_app_installation_action: Tool = {
  name: "mittwald_app_installation_action",
  description: "Execute an action on an app installation. Available actions are start, stop, and restart. These control the runtime state of the application.",
  inputSchema: {
    type: "object",
    properties: {
      appInstallationId: {
        type: "string",
        description: "The UUID of the app installation to perform the action on"
      },
      action: {
        type: "string",
        enum: ["start", "stop", "restart"],
        description: "The action to perform on the app installation"
      }
    },
    required: ["appInstallationId", "action"]
  },
  _meta: {
    hidden: false,
    title: "Execute App Installation Action",
    type: "server"
  }
};

export const mittwald_app_installation_copy: Tool = {
  name: "mittwald_app_installation_copy",
  description: "Copy an app installation to another project. Creates a duplicate of the installation with the same configuration but in a different project.",
  inputSchema: {
    type: "object",
    properties: {
      appInstallationId: {
        type: "string",
        description: "The UUID of the app installation to copy"
      },
      description: {
        type: "string",
        description: "Description for the new copied app installation"
      },
      projectId: {
        type: "string",
        description: "The UUID of the target project to copy the installation to"
      }
    },
    required: ["appInstallationId", "description", "projectId"]
  },
  _meta: {
    hidden: false,
    title: "Copy App Installation",
    type: "server"
  }
};

export const mittwald_app_installation_get_status: Tool = {
  name: "mittwald_app_installation_get_status",
  description: "Get the current runtime status of an app installation. Returns status information including state, uptime, and log file location.",
  inputSchema: {
    type: "object",
    properties: {
      appInstallationId: {
        type: "string",
        description: "The UUID of the app installation to get status for"
      }
    },
    required: ["appInstallationId"]
  },
  _meta: {
    hidden: false,
    title: "Get App Installation Status",
    type: "server"
  }
};

export const mittwald_app_installation_get_missing_dependencies: Tool = {
  name: "mittwald_app_installation_get_missing_dependencies",
  description: "Get missing dependencies for an app installation. Returns a list of system software or database dependencies that are required but not currently satisfied.",
  inputSchema: {
    type: "object",
    properties: {
      appInstallationId: {
        type: "string",
        description: "The UUID of the app installation to check dependencies for"
      }
    },
    required: ["appInstallationId"]
  },
  _meta: {
    hidden: false,
    title: "Get App Installation Missing Dependencies",
    type: "server"
  }
};

export const mittwald_app_installation_actionSuccessMessage = "Successfully executed app installation action";
export const mittwald_app_installation_copySuccessMessage = "Successfully copied app installation";
export const mittwald_app_installation_get_statusSuccessMessage = "Successfully retrieved app installation status";
export const mittwald_app_installation_get_missing_dependenciesSuccessMessage = "Successfully retrieved missing dependencies";