/**
 * @file Tool definitions for Mittwald domain management operations
 * @module constants/tool/mittwald/domain/domain-management
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';

/**
 * MCP tool for listing domains
 * Lists all domains with optional filtering by project, name, or contact
 */
export const mittwald_domain_list: Tool = {
  name: "mittwald_domain_list",
  description: "List all domains with optional filtering by project ID, domain name search, or contact hash. Returns paginated results with domain details including ID, name, project association, and status.",
  inputSchema: {
    type: "object",
    properties: {
      projectId: {
        type: "string",
        description: "UUID of the project to filter domains by (optional)"
      },
      page: {
        type: "number",
        description: "Page number for pagination (default: 1)",
        minimum: 1
      },
      limit: {
        type: "number",
        description: "Number of items per page (default: 50)",
        minimum: 1,
        maximum: 100
      },
      domainSearchName: {
        type: "string",
        description: "Search for domain names containing this string (case-insensitive)"
      },
      contactHash: {
        type: "string",
        description: "Filter domains by contact hash"
      }
    }
  }
};

/**
 * MCP tool for getting a single domain
 * Retrieves detailed information about a specific domain
 */
export const mittwald_domain_get: Tool = {
  name: "mittwald_domain_get",
  description: "Get detailed information about a specific domain by its ID. Returns domain details including nameservers, contacts, project association, and current status.",
  inputSchema: {
    type: "object",
    properties: {
      domainId: {
        type: "string",
        description: "UUID of the domain to retrieve"
      }
    },
    required: ["domainId"]
  }
};

/**
 * MCP tool for deleting a domain
 * Permanently deletes a domain from the account
 */
export const mittwald_domain_delete: Tool = {
  name: "mittwald_domain_delete",
  description: "Delete a domain permanently. This action cannot be undone and will remove the domain from your account.",
  inputSchema: {
    type: "object",
    properties: {
      domainId: {
        type: "string",
        description: "UUID of the domain to delete"
      }
    },
    required: ["domainId"]
  }
};

/**
 * MCP tool for checking domain availability
 * Checks if a domain name is available for registration
 */
export const mittwald_domain_check_registrability: Tool = {
  name: "mittwald_domain_check_registrability",
  description: "Check if a domain name is available for registration. Returns availability status and additional information about the domain.",
  inputSchema: {
    type: "object",
    properties: {
      domain: {
        type: "string",
        description: "The domain name to check (e.g., 'example.com')"
      }
    },
    required: ["domain"]
  }
};

/**
 * MCP tool for updating domain project assignment
 * Moves a domain to a different project
 */
export const mittwald_domain_update_project: Tool = {
  name: "mittwald_domain_update_project",
  description: "Update the project assignment for a domain. Moves the domain to a different project within your account.",
  inputSchema: {
    type: "object",
    properties: {
      domainId: {
        type: "string",
        description: "UUID of the domain to update"
      },
      projectId: {
        type: "string",
        description: "UUID of the new project to assign the domain to"
      }
    },
    required: ["domainId", "projectId"]
  }
};