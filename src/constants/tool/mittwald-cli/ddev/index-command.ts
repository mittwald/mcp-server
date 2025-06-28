import { z } from "zod";

export const ddev_main = {
  name: "mittwald_ddev",
  description: "Integrate your mittwald projects with DDEV. Shows available DDEV subcommands for working with local development environments.",
  parameters: z.object({
    help: z
      .boolean()
      .optional()
      .describe("Show help information for DDEV integration commands")
  })
};