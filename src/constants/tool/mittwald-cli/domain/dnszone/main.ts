import { z } from "zod";

export const domain_dnszone_main = {
  name: "mittwald_domain_dnszone",
  description: "DNS zone management for Mittwald domains. Shows available DNS zone subcommands for managing DNS records and zones.",
  parameters: z.object({
    help: z
      .boolean()
      .optional()
      .describe("Show help information for DNS zone management commands")
  })
};