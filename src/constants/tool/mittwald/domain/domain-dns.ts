/**
 * @file Tool definitions for Mittwald domain DNS and nameserver operations
 * @module constants/tool/mittwald/domain/domain-dns
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';

/**
 * MCP tool for updating domain nameservers
 * Updates the nameserver configuration for a domain
 */
export const mittwald_domain_update_nameservers: Tool = {
  name: "mittwald_domain_update_nameservers",
  description: "Update the nameserver configuration for a domain. Provide a list of nameserver hostnames to replace the current configuration.",
  inputSchema: {
    type: "object",
    properties: {
      domainId: {
        type: "string",
        description: "UUID of the domain to update"
      },
      nameservers: {
        type: "array",
        description: "List of nameserver hostnames (e.g., ['ns1.example.com', 'ns2.example.com'])",
        items: {
          type: "string"
        },
        minItems: 2,
        maxItems: 6
      }
    },
    required: ["domainId", "nameservers"]
  }
};

/**
 * MCP tool for creating domain auth code
 * Creates an authorization code for domain transfer
 */
export const mittwald_domain_create_auth_code: Tool = {
  name: "mittwald_domain_create_auth_code",
  description: "Create an authorization code (auth code) for domain transfer. This code is required when transferring a domain to another registrar.",
  inputSchema: {
    type: "object",
    properties: {
      domainId: {
        type: "string",
        description: "UUID of the domain to create auth code for"
      }
    },
    required: ["domainId"]
  }
};

/**
 * MCP tool for updating domain auth code
 * Updates an existing authorization code for domain
 */
export const mittwald_domain_update_auth_code: Tool = {
  name: "mittwald_domain_update_auth_code",
  description: "Update the authorization code (auth code) for a domain. Use this to set a new auth code for domain transfer purposes.",
  inputSchema: {
    type: "object",
    properties: {
      domainId: {
        type: "string",
        description: "UUID of the domain to update"
      },
      authCode: {
        type: "string",
        description: "The new authorization code to set"
      }
    },
    required: ["domainId", "authCode"]
  }
};

/**
 * MCP tool for resending domain email
 * Resends domain-related emails (e.g., verification, transfer)
 */
export const mittwald_domain_resend_email: Tool = {
  name: "mittwald_domain_resend_email",
  description: "Resend domain-related emails such as verification or transfer confirmation emails.",
  inputSchema: {
    type: "object",
    properties: {
      domainId: {
        type: "string",
        description: "UUID of the domain to resend email for"
      }
    },
    required: ["domainId"]
  }
};

/**
 * MCP tool for aborting domain declaration
 * Aborts an ongoing domain declaration process
 */
export const mittwald_domain_abort_declaration: Tool = {
  name: "mittwald_domain_abort_declaration",
  description: "Abort an ongoing domain declaration process. Use this to cancel a domain registration or transfer that is in progress.",
  inputSchema: {
    type: "object",
    properties: {
      domainId: {
        type: "string",
        description: "UUID of the domain to abort declaration for"
      }
    },
    required: ["domainId"]
  }
};