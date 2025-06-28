import { z } from "zod";

export const domain_dnszone_update = {
  name: "mittwald_domain_dnszone_update",
  description: "Updates a record set of a DNS zone. Supports A, MX, TXT, SRV, and CNAME record types with various configuration options.",
  parameters: z.object({
    dnszoneId: z
      .string()
      .describe("ID or domain name of a DNS zone"),
    recordSet: z
      .enum(["a", "mx", "txt", "srv", "cname"])
      .describe("The record type of the record set"),
    projectId: z
      .string()
      .optional()
      .describe("ID or short ID of a project; optional if a default project is set in the context"),
    quiet: z
      .boolean()
      .optional()
      .describe("Suppress process output and only display a machine-readable summary"),
    managed: z
      .boolean()
      .optional()
      .describe("Reset this record set to fully-managed (only for A and MX records)"),
    record: z
      .array(z.string())
      .optional()
      .describe("The records to set; may not be used with --managed"),
    ttl: z
      .number()
      .optional()
      .describe("The TTL of the record set; omit to use the default TTL"),
    unset: z
      .boolean()
      .optional()
      .describe("Set this to remove all records from the record set")
  })
};