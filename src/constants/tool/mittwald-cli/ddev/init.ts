import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const ddev_init: Tool = {
  name: "mittwald_ddev_init",
  description: "Initialize a new ddev project in the current directory for an existing app installation. This will create DDEV configuration files, install the mittwald DDEV addon, and add SSH credentials.",
  inputSchema: {
    type: "object",
    properties: {
      installationId: {
        type: "string",
        description: "ID or short ID of an app installation; optional if a default app installation is set in the context"
      },
      quiet: {
        type: "boolean",
        description: "Suppress process output and only display a machine-readable summary"
      },
      overrideType: {
        type: "string",
        enum: [
          "backdrop",
          "craftcms",
          "django4",
          "drupal6",
          "drupal7",
          "drupal",
          "laravel",
          "magento",
          "magento2",
          "php",
          "python",
          "shopware6",
          "silverstripe",
          "typo3",
          "wordpress",
          "auto"
        ],
        default: "auto",
        description: "Override the type of the generated DDEV configuration"
      },
      withoutDatabase: {
        type: "boolean",
        description: "Create a DDEV project without a database"
      },
      databaseId: {
        type: "string",
        description: "ID of the application database"
      },
      projectName: {
        type: "string",
        description: "DDEV project name"
      },
      overrideMittwaldPlugin: {
        type: "string",
        description: "Override the mittwald plugin (development flag)"
      }
    },
    required: []
  }
};