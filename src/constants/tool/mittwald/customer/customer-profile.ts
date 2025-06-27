/**
 * @file Tool definitions for Mittwald Customer Profile Management
 * @module constants/tool/mittwald/customer/customer-profile
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';

/**
 * Tool for uploading customer avatar
 */
export const mittwald_customer_upload_avatar: Tool = {
  name: "mittwald_customer_upload_avatar",
  description: "Request an upload URL for a customer avatar image. Returns a URL where the avatar image can be uploaded.",
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
 * Tool for deleting customer avatar
 */
export const mittwald_customer_delete_avatar: Tool = {
  name: "mittwald_customer_delete_avatar",
  description: "Delete the avatar image for a customer.",
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
 * Tool for listing customer memberships
 */
export const mittwald_customer_list_memberships: Tool = {
  name: "mittwald_customer_list_memberships",
  description: "List all memberships for a customer, showing which organizations and projects they belong to.",
  inputSchema: {
    type: "object",
    properties: {
      customerId: {
        type: "string",
        description: "The unique identifier of the customer"
      },
      limit: {
        type: "number",
        description: "Maximum number of memberships to return"
      },
      skip: {
        type: "number",
        description: "Number of memberships to skip for pagination"
      }
    },
    required: ["customerId"]
  }
};

/**
 * Tool for leaving a customer organization
 */
export const mittwald_customer_leave: Tool = {
  name: "mittwald_customer_leave",
  description: "Leave a customer organization. This will remove your membership from the customer account.",
  inputSchema: {
    type: "object",
    properties: {
      customerId: {
        type: "string",
        description: "The unique identifier of the customer organization to leave"
      }
    },
    required: ["customerId"]
  }
};

/**
 * Tool for getting customer wallet
 */
export const mittwald_customer_get_wallet: Tool = {
  name: "mittwald_customer_get_wallet",
  description: "Get wallet information for a customer, including balance and payment methods.",
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
 * Tool for creating customer wallet
 */
export const mittwald_customer_create_wallet: Tool = {
  name: "mittwald_customer_create_wallet",
  description: "Create a new wallet for a customer to manage prepaid credits and payment methods.",
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
 * Tool for creating recommendation suggestion
 */
export const mittwald_customer_create_recommendation_suggestion: Tool = {
  name: "mittwald_customer_create_recommendation_suggestion",
  description: "Create a recommendation suggestion for a customer, used for referral or affiliate programs.",
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