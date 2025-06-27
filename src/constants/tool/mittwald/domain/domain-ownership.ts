/**
 * @file Tool definitions for Mittwald domain ownership and contact operations
 * @module constants/tool/mittwald/domain/domain-ownership
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';

/**
 * MCP tool for updating domain contact
 * Updates contact information for a domain
 */
export const mittwald_domain_update_contact: Tool = {
  name: "mittwald_domain_update_contact",
  description: "Update contact information for a domain. Specify the contact type (owner, admin, tech, or billing) and provide the new contact details.",
  inputSchema: {
    type: "object",
    properties: {
      domainId: {
        type: "string",
        description: "UUID of the domain to update"
      },
      contact: {
        type: "string",
        enum: ["owner", "admin", "tech", "billing"],
        description: "Type of contact to update"
      },
      contactData: {
        type: "object",
        description: "Contact information to update",
        properties: {
          firstName: {
            type: "string",
            description: "First name of the contact"
          },
          lastName: {
            type: "string",
            description: "Last name of the contact"
          },
          organization: {
            type: "string",
            description: "Organization name (optional)"
          },
          street: {
            type: "string",
            description: "Street address"
          },
          city: {
            type: "string",
            description: "City"
          },
          postalCode: {
            type: "string",
            description: "Postal/ZIP code"
          },
          country: {
            type: "string",
            description: "Country code (e.g., 'DE', 'US')"
          },
          email: {
            type: "string",
            description: "Email address"
          },
          phone: {
            type: "string",
            description: "Phone number"
          }
        },
        required: ["firstName", "lastName", "street", "city", "postalCode", "country", "email", "phone"]
      }
    },
    required: ["domainId", "contact", "contactData"]
  }
};

/**
 * MCP tool for getting domain handle fields
 * Retrieves required handle fields for a domain TLD
 */
export const mittwald_domain_get_handle_fields: Tool = {
  name: "mittwald_domain_get_handle_fields",
  description: "Get the required handle fields for a specific domain TLD. This information is needed when registering or updating domain contacts for certain top-level domains that have special requirements.",
  inputSchema: {
    type: "object",
    properties: {
      domainName: {
        type: "string",
        description: "The domain name to get handle fields for (e.g., 'example.de')"
      }
    },
    required: ["domainName"]
  }
};

/**
 * MCP tool for getting domain screenshot
 * Retrieves the latest screenshot of a domain's website
 */
export const mittwald_domain_get_screenshot: Tool = {
  name: "mittwald_domain_get_screenshot",
  description: "Get the latest screenshot of a domain's website. Returns a URL to the screenshot image if available.",
  inputSchema: {
    type: "object",
    properties: {
      domainId: {
        type: "string",
        description: "UUID of the domain to get screenshot for"
      }
    },
    required: ["domainId"]
  }
};

/**
 * MCP tool for getting supported TLDs
 * Lists all supported top-level domains
 */
export const mittwald_domain_get_supported_tlds: Tool = {
  name: "mittwald_domain_get_supported_tlds",
  description: "Get a list of all supported top-level domains (TLDs) that can be registered through Mittwald. Returns TLD information including pricing and requirements.",
  inputSchema: {
    type: "object",
    properties: {}
  }
};

/**
 * MCP tool for getting domain contract
 * Retrieves contract information for a domain
 */
export const mittwald_domain_get_contract: Tool = {
  name: "mittwald_domain_get_contract",
  description: "Get contract details for a specific domain. Returns information about the domain's contract including billing and renewal details.",
  inputSchema: {
    type: "object",
    properties: {
      domainId: {
        type: "string",
        description: "UUID of the domain to get contract for"
      }
    },
    required: ["domainId"]
  }
};