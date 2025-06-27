/**
 * @file Handlers for Mittwald Customer Management tools
 * @module handlers/tools/mittwald/customer/customer-management
 */

import { getMittwaldClient } from '../../../../services/mittwald/index.js';
import { formatToolResponse } from '../../types.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type {
  ListCustomersArgs,
  GetCustomerArgs,
  CreateCustomerArgs,
  UpdateCustomerArgs,
  DeleteCustomerArgs,
  IsCustomerLegallyCompetentArgs
} from '../../../../types/mittwald/customer.js';

/**
 * Handler for listing customers
 */
export const handleCustomerList = async (args: ListCustomersArgs): Promise<CallToolResult> => {
  try {
    const client = getMittwaldClient();
    
    const response = await client.api.customer.listCustomers({
      queryParameters: {
        limit: args.limit,
        skip: args.skip
      }
    });

    if (response.status === 200) {
      return formatToolResponse({
        message: `Successfully retrieved ${response.data.length} customers`,
        result: {
          customers: response.data
        }
      });
    }

    throw new Error(`Failed to list customers: ${response.status}`);
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to list customers: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error
      }
    });
  }
};

/**
 * Handler for getting a specific customer
 */
export const handleCustomerGet = async (args: GetCustomerArgs): Promise<CallToolResult> => {
  try {
    const client = getMittwaldClient();
    
    const response = await client.api.customer.getCustomer({
      customerId: args.customerId
    });

    if (response.status === 200) {
      return formatToolResponse({
        message: "Successfully retrieved customer details",
        result: {
          customer: response.data
        }
      });
    }

    throw new Error(`Failed to get customer: ${response.status}`);
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to get customer: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error
      }
    });
  }
};

/**
 * Handler for creating a customer
 */
export const handleCustomerCreate = async (args: CreateCustomerArgs): Promise<CallToolResult> => {
  try {
    const client = getMittwaldClient();
    
    const response = await client.api.customer.createCustomer({
      data: {
        name: args.company || `${args.firstName || ''} ${args.lastName || ''}`.trim() || 'Customer'
      }
    });

    if (response.status === 201) {
      return formatToolResponse({
        message: "Successfully created customer",
        result: {
          customerId: response.data.customerId
        }
      });
    }

    throw new Error(`Failed to create customer: ${response.status}`);
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to create customer: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error
      }
    });
  }
};

/**
 * Handler for updating a customer
 */
export const handleCustomerUpdate = async (args: UpdateCustomerArgs): Promise<CallToolResult> => {
  try {
    const client = getMittwaldClient();
    
    const { customerId, ...updateData } = args;
    
    const response = await client.api.customer.updateCustomer({
      customerId,
      data: {
        customerId,
        name: updateData.company || `${updateData.firstName || ''} ${updateData.lastName || ''}`.trim() || 'Customer'
      }
    });

    if (response.status === 200) {
      return formatToolResponse({
        message: "Successfully updated customer",
        result: {
          success: true
        }
      });
    }

    throw new Error(`Failed to update customer: ${response.status}`);
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to update customer: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error
      }
    });
  }
};

/**
 * Handler for deleting a customer
 */
export const handleCustomerDelete = async (args: DeleteCustomerArgs): Promise<CallToolResult> => {
  try {
    const client = getMittwaldClient();
    
    const response = await client.api.customer.deleteCustomer({
      customerId: args.customerId
    });

    if (response.status === 200) {
      return formatToolResponse({
        message: "Successfully deleted customer",
        result: {
          success: true
        }
      });
    }

    throw new Error(`Failed to delete customer: ${response.status}`);
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to delete customer: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error
      }
    });
  }
};

/**
 * Handler for checking if customer is legally competent
 */
export const handleCustomerIsLegallyCompetent = async (args: IsCustomerLegallyCompetentArgs): Promise<CallToolResult> => {
  try {
    const client = getMittwaldClient();
    
    const response = await client.api.customer.isCustomerLegallyCompetent({
      customerId: args.customerId
    });

    if (response.status === 200) {
      return formatToolResponse({
        message: "Successfully checked customer legal competence",
        result: {
          isLegallyCompetent: response.data.isLegallyCompetent
        }
      });
    }

    throw new Error(`Failed to check customer legal competence: ${response.status}`);
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to check customer legal competence: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error
      }
    });
  }
};