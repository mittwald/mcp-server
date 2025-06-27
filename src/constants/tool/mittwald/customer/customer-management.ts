/**
 * @file Tool definitions for Mittwald Customer Management
 * @module constants/tool/mittwald/customer/customer-management
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';

/**
 * Tool for listing customers
 */
export const mittwald_customer_list: Tool = {
  name: "mittwald_customer_list",
  description: "List all customers with optional pagination. Returns a list of customer records including their basic information.",
  inputSchema: {
    type: "object",
    properties: {
      limit: {
        type: "number",
        description: "Maximum number of customers to return (default: 100, max: 1000)"
      },
      skip: {
        type: "number",
        description: "Number of customers to skip for pagination"
      },
      page: {
        type: "number",
        description: "Page number for pagination (alternative to skip)"
      }
    }
  }
};

/**
 * Tool for getting a specific customer
 */
export const mittwald_customer_get: Tool = {
  name: "mittwald_customer_get",
  description: "Get detailed information about a specific customer by their ID.",
  inputSchema: {
    type: "object",
    properties: {
      customerId: {
        type: "string",
        description: "The unique identifier of the customer"
      }
    },
    required: ["customerId"]
  }
};

/**
 * Tool for creating a new customer
 */
export const mittwald_customer_create: Tool = {
  name: "mittwald_customer_create",
  description: "Create a new customer account. Requires an email address and optionally other profile information.",
  inputSchema: {
    type: "object",
    properties: {
      email: {
        type: "string",
        description: "Email address for the customer account",
        format: "email"
      },
      company: {
        type: "string",
        description: "Company name"
      },
      firstName: {
        type: "string",
        description: "Customer's first name"
      },
      lastName: {
        type: "string",
        description: "Customer's last name"
      },
      phoneNumber: {
        type: "string",
        description: "Customer's phone number"
      },
      title: {
        type: "string",
        description: "Professional title (e.g., Dr., Prof.)"
      },
      salutation: {
        type: "string",
        description: "Salutation (e.g., Mr., Ms.)"
      },
      country: {
        type: "string",
        description: "Country code (ISO 3166-1 alpha-2)"
      }
    },
    required: ["email"]
  }
};

/**
 * Tool for updating customer information
 */
export const mittwald_customer_update: Tool = {
  name: "mittwald_customer_update",
  description: "Update an existing customer's profile information.",
  inputSchema: {
    type: "object",
    properties: {
      customerId: {
        type: "string",
        description: "The unique identifier of the customer to update"
      },
      company: {
        type: "string",
        description: "Company name"
      },
      firstName: {
        type: "string",
        description: "Customer's first name"
      },
      lastName: {
        type: "string",
        description: "Customer's last name"
      },
      phoneNumber: {
        type: "string",
        description: "Customer's phone number"
      },
      title: {
        type: "string",
        description: "Professional title (e.g., Dr., Prof.)"
      },
      salutation: {
        type: "string",
        description: "Salutation (e.g., Mr., Ms.)"
      },
      website: {
        type: "string",
        description: "Customer's website URL"
      }
    },
    required: ["customerId"]
  }
};

/**
 * Tool for deleting a customer
 */
export const mittwald_customer_delete: Tool = {
  name: "mittwald_customer_delete",
  description: "Delete a customer account. This action is permanent and cannot be undone.",
  inputSchema: {
    type: "object",
    properties: {
      customerId: {
        type: "string",
        description: "The unique identifier of the customer to delete"
      }
    },
    required: ["customerId"]
  }
};

/**
 * Tool for checking if customer is legally competent
 */
export const mittwald_customer_is_legally_competent: Tool = {
  name: "mittwald_customer_is_legally_competent",
  description: "Check if a customer is legally competent (e.g., of legal age, not under guardianship).",
  inputSchema: {
    type: "object",
    properties: {
      customerId: {
        type: "string",
        description: "The unique identifier of the customer"
      }
    },
    required: ["customerId"]
  }
};