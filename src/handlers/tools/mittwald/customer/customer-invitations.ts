/**
 * @file Handlers for Mittwald Customer Invitation tools
 * @module handlers/tools/mittwald/customer/customer-invitations
 */

import { getMittwaldClient } from '../../../../services/mittwald/index.js';
import { formatToolResponse } from '../../types.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type {
  ListCustomerInvitesArgs,
  CreateCustomerInviteArgs,
  AcceptCustomerInviteArgs
} from '../../../../types/mittwald/customer.js';

/**
 * Handler for listing customer invitations
 */
export const handleCustomerListInvites = async (args: ListCustomerInvitesArgs): Promise<CallToolResult> => {
  try {
    const client = getMittwaldClient();
    
    const response = await client.api.customer.listInvitesForCustomer({
      customerId: args.customerId,
      queryParameters: {
        limit: args.limit,
        skip: args.skip
      }
    });

    if (response.status === 200) {
      return formatToolResponse({
        message: `Successfully retrieved ${response.data.length} invitations`,
        result: {
          invitations: response.data
        }
      });
    }

    throw new Error(`Failed to list invitations: ${response.status}`);
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to list invitations: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error
      }
    });
  }
};

/**
 * Handler for creating customer invitation
 */
export const handleCustomerCreateInvite = async (args: CreateCustomerInviteArgs): Promise<CallToolResult> => {
  try {
    const client = getMittwaldClient();
    
    const response = await client.api.customer.createCustomerInvite({
      customerId: args.customerId,
      data: {
        mailAddress: args.mailAddress,
        role: 'member', // Default role
        message: args.message
      }
    });

    if (response.status === 201) {
      return formatToolResponse({
        message: "Successfully created customer invitation",
        result: {
          inviteId: response.data.id
        }
      });
    }

    throw new Error(`Failed to create invitation: ${response.status}`);
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to create invitation: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error
      }
    });
  }
};

/**
 * Handler for accepting customer invitation
 */
export const handleCustomerAcceptInvite = async (args: AcceptCustomerInviteArgs): Promise<CallToolResult> => {
  try {
    const client = getMittwaldClient();
    
    const response = await client.api.customer.acceptCustomerInvite({
      customerInviteId: args.customerInviteId,
      data: {
        invitationToken: args.invitationToken
      }
    });

    if (response.status === 204) {
      return formatToolResponse({
        message: "Successfully accepted customer invitation",
        result: {
          success: true
        }
      });
    }

    throw new Error(`Failed to accept invitation: ${response.status}`);
  } catch (error) {
    return formatToolResponse({
      status: "error",
      message: `Failed to accept invitation: ${error instanceof Error ? error.message : "Unknown error"}`,
      error: {
        type: "API_ERROR",
        details: error
      }
    });
  }
};