import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const ddev_render_config: Tool = {
  name: "mittwald_ddev_render_config",
  description: "Generate a DDEV configuration YAML file for the current app. This command initializes a new DDEV configuration in the current directory.",
  inputSchema: {
    type: "object",
    properties: {
      installationId: {
        type: "string",
        description: "ID or short ID of an app installation; optional if a default app installation is set in the context"
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
      }
    },
    required: []
  }
};