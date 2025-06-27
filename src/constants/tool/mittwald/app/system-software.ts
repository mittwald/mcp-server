import type { Tool } from '@modelcontextprotocol/sdk/types.js';

/**
 * Tool definitions for System Software operations
 * 
 * @module
 * This module contains tool definitions for managing system software
 */

export const mittwald_system_software_list: Tool = {
  name: "mittwald_system_software_list",
  description: "List available system software packages. Returns all system software that can be installed alongside applications, such as PHP, Node.js, Python, etc.",
  inputSchema: {
    type: "object",
    properties: {
      limit: {
        type: "number",
        description: "Maximum number of system software packages to return",
        default: 100
      },
      skip: {
        type: "number",
        description: "Number of system software packages to skip (for pagination)",
        default: 0
      }
    },
    required: []
  },
  _meta: {
    hidden: false,
    title: "List System Software",
    type: "server"
  }
};

export const mittwald_system_software_get: Tool = {
  name: "mittwald_system_software_get",
  description: "Get detailed information about a specific system software package. Returns package details including available versions and metadata.",
  inputSchema: {
    type: "object",
    properties: {
      systemSoftwareId: {
        type: "string",
        description: "The UUID of the system software package to retrieve"
      }
    },
    required: ["systemSoftwareId"]
  },
  _meta: {
    hidden: false,
    title: "Get System Software Details",
    type: "server"
  }
};

export const mittwald_system_software_list_versions: Tool = {
  name: "mittwald_system_software_list_versions",
  description: "List available versions for a specific system software package. Returns version details including external version numbers and expiry dates.",
  inputSchema: {
    type: "object",
    properties: {
      systemSoftwareId: {
        type: "string",
        description: "The UUID of the system software to list versions for"
      },
      recommended: {
        type: "boolean",
        description: "Filter to only show recommended versions",
        default: false
      }
    },
    required: ["systemSoftwareId"]
  },
  _meta: {
    hidden: false,
    title: "List System Software Versions",
    type: "server"
  }
};

export const mittwald_system_software_get_version: Tool = {
  name: "mittwald_system_software_get_version",
  description: "Get detailed information about a specific system software version. Returns complete version details including dependencies and configuration options.",
  inputSchema: {
    type: "object",
    properties: {
      systemSoftwareId: {
        type: "string",
        description: "The UUID of the system software"
      },
      systemSoftwareVersionId: {
        type: "string",
        description: "The UUID of the system software version to retrieve"
      }
    },
    required: ["systemSoftwareId", "systemSoftwareVersionId"]
  },
  _meta: {
    hidden: false,
    title: "Get System Software Version Details",
    type: "server"
  }
};

export const mittwald_app_installation_get_system_software: Tool = {
  name: "mittwald_app_installation_get_system_software",
  description: "Get system software installed for a specific app installation. Returns list of currently installed system software with their versions and update policies.",
  inputSchema: {
    type: "object",
    properties: {
      appInstallationId: {
        type: "string",
        description: "The UUID of the app installation to get system software for"
      }
    },
    required: ["appInstallationId"]
  },
  _meta: {
    hidden: false,
    title: "Get App Installation System Software",
    type: "server"
  }
};

export const mittwald_app_installation_update_system_software: Tool = {
  name: "mittwald_app_installation_update_system_software",
  description: "Update system software for an app installation. Allows changing versions and update policies for installed system software.",
  inputSchema: {
    type: "object",
    properties: {
      appInstallationId: {
        type: "string",
        description: "The UUID of the app installation to update system software for"
      },
      systemSoftware: {
        type: "array",
        description: "List of system software to update",
        items: {
          type: "object",
          properties: {
            systemSoftwareId: {
              type: "string",
              description: "The UUID of the system software"
            },
            systemSoftwareVersionId: {
              type: "string",
              description: "The UUID of the version to install"
            },
            updatePolicy: {
              type: "string",
              enum: ["none", "inheritedFromApp", "patchLevel", "all"],
              description: "Update policy for this system software"
            }
          },
          required: ["systemSoftwareId", "systemSoftwareVersionId", "updatePolicy"]
        }
      }
    },
    required: ["appInstallationId", "systemSoftware"]
  },
  _meta: {
    hidden: false,
    title: "Update App Installation System Software",
    type: "server"
  }
};

export const mittwald_system_software_listSuccessMessage = "Successfully retrieved system software list";
export const mittwald_system_software_getSuccessMessage = "Successfully retrieved system software details";
export const mittwald_system_software_list_versionsSuccessMessage = "Successfully retrieved system software versions";
export const mittwald_system_software_get_versionSuccessMessage = "Successfully retrieved system software version details";
export const mittwald_app_installation_get_system_softwareSuccessMessage = "Successfully retrieved app installation system software";
export const mittwald_app_installation_update_system_softwareSuccessMessage = "Successfully updated app installation system software";