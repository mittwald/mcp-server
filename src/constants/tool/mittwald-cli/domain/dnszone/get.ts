import { z } from "zod";

export const domain_dnszone_get = {
  name: "mittwald_domain_dnszone_get",
  description: "Gets a specific DNS zone by ID or domain name. Returns detailed information about the DNS zone configuration.",
  parameters: z.object({
    dnszoneId: z
      .string()
      .describe("ID or domain name of a DNS zone"),
    output: z
      .enum(["txt", "json", "yaml"])
      .default("txt")
      .describe("Output format")
  })
};