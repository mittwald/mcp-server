/**
 * @file Tool definitions for Mittwald Customer Invitations
 * @module constants/tool/mittwald/customer/customer-invitations
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';

/**
 * Tool for listing customer invitations
 */
export const mittwald_customer_list_invites: Tool = {
  name: "mittwald_customer_list_invites",
  description: "List all pending invitations for a customer organization.",
  inputSchema: {
    type: "object",
    properties: {
      customerId: {
        type: "string",
        description: "The unique identifier of the customer"
      },
      limit: {
        type: "number",
        description: "Maximum number of invitations to return"
      },
      skip: {
        type: "number",
        description: "Number of invitations to skip for pagination"
      }
    },
    required: ["customerId"]
  }
};

/**
 * Tool for creating customer invitation
 */
export const mittwald_customer_create_invite: Tool = {
  name: "mittwald_customer_create_invite",
  description: "Create an invitation to join a customer organization. The invited user will receive an email with the invitation.",
  inputSchema: {
    type: "object",
    properties: {
      customerId: {
        type: "string",
        description: "The unique identifier of the customer"
      },
      addressId: {
        type: "string",
        description: "The address ID for the invitation"
      },
      mailAddress: {
        type: "string",
        description: "Email address of the person to invite",
        format: "email"
      },
      message: {
        type: "string",
        description: "Optional personal message to include in the invitation email"
      },
      membershipRoles: {
        type: "array",
        items: {
          type: "string"
        },
        description: "Roles to assign to the invited member (e.g., 'owner', 'member')"
      }
    },
    required: ["customerId", "addressId", "mailAddress"]
  }
};

/**
 * Tool for accepting customer invitation
 */
export const mittwald_customer_accept_invite: Tool = {
  name: "mittwald_customer_accept_invite",
  description: "Accept an invitation to join a customer organization.",
  inputSchema: {
    type: "object",
    properties: {
      customerInviteId: {
        type: "string",
        description: "The unique identifier of the invitation"
      },
      invitationToken: {
        type: "string",
        description: "Optional invitation token from the invitation email"
      }
    },
    required: ["customerInviteId"]
  }
};