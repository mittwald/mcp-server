/**
 * @file Tool definitions for Mittwald Customer Miscellaneous Operations
 * @module constants/tool/mittwald/customer/customer-misc
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';

/**
 * Tool for getting customer conversation preferences
 */
export const mittwald_customer_get_conversation_preferences: Tool = {
  name: "mittwald_customer_get_conversation_preferences",
  description: "Get conversation preferences for a customer, including notification settings and communication preferences.",
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
 * Tool for getting customer extension instance
 */
export const mittwald_customer_get_extension_instance: Tool = {
  name: "mittwald_customer_get_extension_instance",
  description: "Get details of a specific extension instance for a customer.",
  inputSchema: {
    type: "object",
    properties: {
      customerId: {
        type: "string",
        description: "The unique identifier of the customer"
      },
      extensionId: {
        type: "string",
        description: "The unique identifier of the extension"
      }
    },
    required: ["customerId", "extensionId"]
  }
};

/**
 * Tool for getting customer invoice settings
 */
export const mittwald_customer_get_invoice_settings: Tool = {
  name: "mittwald_customer_get_invoice_settings",
  description: "Get invoice settings for a customer, including billing address and payment preferences.",
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
 * Tool for updating customer invoice settings
 */
export const mittwald_customer_update_invoice_settings: Tool = {
  name: "mittwald_customer_update_invoice_settings",
  description: "Update invoice settings for a customer, such as billing address and payment preferences.",
  inputSchema: {
    type: "object",
    properties: {
      customerId: {
        type: "string",
        description: "The unique identifier of the customer"
      },
      billingAddress: {
        type: "object",
        description: "Updated billing address information"
      },
      paymentMethod: {
        type: "string",
        description: "Preferred payment method"
      }
    },
    required: ["customerId"]
  }
};

/**
 * Tool for listing customer invoices
 */
export const mittwald_customer_list_invoices: Tool = {
  name: "mittwald_customer_list_invoices",
  description: "List all invoices for a customer, including paid, unpaid, and overdue invoices.",
  inputSchema: {
    type: "object",
    properties: {
      customerId: {
        type: "string",
        description: "The unique identifier of the customer"
      },
      limit: {
        type: "number",
        description: "Maximum number of invoices to return"
      },
      skip: {
        type: "number",
        description: "Number of invoices to skip for pagination"
      }
    },
    required: ["customerId"]
  }
};

/**
 * Tool for getting customer invoice details
 */
export const mittwald_customer_get_invoice: Tool = {
  name: "mittwald_customer_get_invoice",
  description: "Get detailed information about a specific invoice for a customer.",
  inputSchema: {
    type: "object",
    properties: {
      customerId: {
        type: "string",
        description: "The unique identifier of the customer"
      },
      invoiceId: {
        type: "string",
        description: "The unique identifier of the invoice"
      }
    },
    required: ["customerId", "invoiceId"]
  }
};

/**
 * Tool for getting invoice file access token
 */
export const mittwald_customer_get_invoice_file_access_token: Tool = {
  name: "mittwald_customer_get_invoice_file_access_token",
  description: "Get an access token to download an invoice file (PDF) for a customer.",
  inputSchema: {
    type: "object",
    properties: {
      customerId: {
        type: "string",
        description: "The unique identifier of the customer"
      },
      invoiceId: {
        type: "string",
        description: "The unique identifier of the invoice"
      }
    },
    required: ["customerId", "invoiceId"]
  }
};

/**
 * Tool for listing customer orders
 */
export const mittwald_customer_list_orders: Tool = {
  name: "mittwald_customer_list_orders",
  description: "List all orders for a customer, including completed, pending, and cancelled orders.",
  inputSchema: {
    type: "object",
    properties: {
      customerId: {
        type: "string",
        description: "The unique identifier of the customer"
      },
      limit: {
        type: "number",
        description: "Maximum number of orders to return"
      },
      skip: {
        type: "number",
        description: "Number of orders to skip for pagination"
      }
    },
    required: ["customerId"]
  }
};