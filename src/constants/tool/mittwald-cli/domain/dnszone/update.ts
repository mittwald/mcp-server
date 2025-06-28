import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const domain_dnszone_update: Tool = {
  name: "mittwald_domain_dnszone_update",
  description: "Updates a record set of a DNS zone. Supports A, MX, TXT, SRV, and CNAME record types with various configuration options.",
  inputSchema: {
    type: "object",
    properties: {
      dnszoneId: {
        type: "string",
        description: "ID or domain name of a DNS zone"
      },
      recordSet: {
        type: "string",
        enum: ["a", "mx", "txt", "srv", "cname"],
        description: "The record type of the record set"
      },
      projectId: {
        type: "string",
        description: "ID or short ID of a project; optional if a default project is set in the context"
      },
      quiet: {
        type: "boolean",
        description: "Suppress process output and only display a machine-readable summary"
      },
      managed: {
        type: "boolean",
        description: "Reset this record set to fully-managed (only for A and MX records)"
      },
      record: {
        type: "array",
        items: {
          type: "string"
        },
        description: "The records to set; may not be used with --managed"
      },
      ttl: {
        type: "number",
        description: "The TTL of the record set; omit to use the default TTL"
      },
      unset: {
        type: "boolean",
        description: "Set this to remove all records from the record set"
      }
    },
    required: ["dnszoneId", "recordSet"]
  }
};