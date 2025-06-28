import { z } from "zod";

export const ddev_init = {
  name: "mittwald_ddev_init",
  description: "Initialize a new ddev project in the current directory for an existing app installation. This will create DDEV configuration files, install the mittwald DDEV addon, and add SSH credentials.",
  parameters: z.object({
    installationId: z
      .string()
      .optional()
      .describe(
        "ID or short ID of an app installation; optional if a default app installation is set in the context"
      ),
    quiet: z
      .boolean()
      .optional()
      .describe("Suppress process output and only display a machine-readable summary"),
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
      .describe("ID of the application database"),
    projectName: z
      .string()
      .optional()
      .describe("DDEV project name"),
    overrideMittwaldPlugin: z
      .string()
      .optional()
      .describe("Override the mittwald plugin (development flag)")
  })
};