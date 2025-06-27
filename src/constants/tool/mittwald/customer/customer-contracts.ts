/**
 * @file Tool definitions for Mittwald Customer Contract Operations
 * @module constants/tool/mittwald/customer/customer-contracts
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';

/**
 * Tool for listing customer contracts
 */
export const mittwald_customer_list_contracts: Tool = {
  name: "mittwald_customer_list_contracts",
  description: "List all contracts for a customer, including active, expired, and pending contracts.",
  inputSchema: {
    type: "object",
    properties: {
      customerId: {
        type: "string",
        description: "The unique identifier of the customer"
      },
      limit: {
        type: "number",
        description: "Maximum number of contracts to return"
      },
      skip: {
        type: "number",
        description: "Number of contracts to skip for pagination"
      }
    },
    required: ["customerId"]
  }
};

/**
 * Tool for getting contract detail by lead finder
 */
export const mittwald_customer_get_lead_fyndr_contract: Tool = {
  name: "mittwald_customer_get_lead_fyndr_contract",
  description: "Get contract details from lead finder profile for a customer.",
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