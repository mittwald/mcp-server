import { z } from "zod";

export const ddev_render_config = {
  name: "mittwald_ddev_render_config",
  description: "Generate a DDEV configuration YAML file for the current app. This command initializes a new DDEV configuration in the current directory.",
  parameters: z.object({
    installationId: z
      .string()
      .optional()
      .describe(
        "ID or short ID of an app installation; optional if a default app installation is set in the context"
      ),
    overrideType: z
      .enum([
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
      ])
      .optional()
      .default("auto")
      .describe("Override the type of the generated DDEV configuration"),
    withoutDatabase: z
      .boolean()
      .optional()
      .describe("Create a DDEV project without a database"),
    databaseId: z
      .string()
      .optional()
      .describe("ID of the application database")
  })
};