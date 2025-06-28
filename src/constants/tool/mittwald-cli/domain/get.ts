import { z } from "zod";

export const domain_get = {
  name: "mittwald_domain_get",
  description: "Gets a specific domain by ID or domain name. Returns detailed information about the domain configuration and settings.",
  parameters: z.object({
    domainId: z
      .string()
      .describe("ID or domain name of a domain"),
    output: z
      .enum(["txt", "json", "yaml"])
      .default("txt")
      .describe("Output format")
  })
};