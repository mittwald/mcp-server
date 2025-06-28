import { z } from "zod";

export const domain_dnszone_list = {
  name: "mittwald_domain_dnszone_list",
  description: "List all DNS zones by project ID. Shows DNS zones associated with projects with various output formats.",
  parameters: z.object({
    output: z
      .enum(["txt", "json", "yaml", "csv", "tsv"])
      .default("txt")
      .describe("Output format"),
    projectId: z
      .string()
      .optional()
      .describe("ID or short ID of a project; optional if a default project is set in the context"),
    extended: z
      .boolean()
      .optional()
      .describe("Show extended information"),
    noHeader: z
      .boolean()
      .optional()
      .describe("Hide table header"),
    noTruncate: z
      .boolean()
      .optional()
      .describe("Do not truncate output (only relevant for txt output)"),
    noRelativeDates: z
      .boolean()
      .optional()
      .describe("Show dates in absolute format, not relative (only relevant for txt output)"),
    csvSeparator: z
      .enum([",", ";"])
      .optional()
      .default(",")
      .describe("Separator for CSV output (only relevant for CSV output)")
  })
};