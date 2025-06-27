/**
 * @file Tool definitions for Mittwald User Profile Management
 * @module constants/tool/mittwald/user/profile
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';

/**
 * Tool for getting current user profile
 */
export const mittwald_user_get_profile: Tool = {
  name: "mittwald_user_get_profile",
  description: "Get the current user's profile information including email, name, and account details.",
  inputSchema: {
    type: "object",
    properties: {},
    required: []
  }
};

/**
 * Tool for getting specific user by ID
 */
export const mittwald_user_get_by_id: Tool = {
  name: "mittwald_user_get_by_id",
  description: "Get profile information for a specific user by their user ID.",
  inputSchema: {
    type: "object",
    properties: {
      userId: {
        type: "string",
        description: "The ID of the user to retrieve"
      }
    },
    required: ["userId"]
  }
};

/**
 * Tool for updating user profile
 */
export const mittwald_user_update_profile: Tool = {
  name: "mittwald_user_update_profile",
  description: "Update the user's profile information for a specific user.",
  inputSchema: {
    type: "object",
    properties: {
      userId: {
        type: "string",
        description: "The ID of the user to update"
      },
      firstName: {
        type: "string",
        description: "User's first name"
      },
      lastName: {
        type: "string",
        description: "User's last name"
      }
    },
    required: ["userId"]
  }
};

/**
 * Tool for getting personal information
 */
export const mittwald_user_get_personal_info: Tool = {
  name: "mittwald_user_get_personal_info",
  description: "Get the current user's personal information including address and contact details.",
  inputSchema: {
    type: "object",
    properties: {},
    required: []
  }
};

/**
 * Tool for updating personal information
 */
export const mittwald_user_update_personal_info: Tool = {
  name: "mittwald_user_update_personal_info",
  description: "Update the current user's personal information including address and contact details.",
  inputSchema: {
    type: "object",
    properties: {
      firstName: {
        type: "string",
        description: "First name"
      },
      lastName: {
        type: "string",
        description: "Last name"
      },
      title: {
        type: "string",
        description: "Title (e.g., Mr., Ms., Dr.)"
      },
      dateOfBirth: {
        type: "string",
        description: "Date of birth in YYYY-MM-DD format"
      },
      streetAddress: {
        type: "string",
        description: "Street address"
      },
      zipCode: {
        type: "string",
        description: "ZIP/Postal code"
      },
      city: {
        type: "string",
        description: "City"
      },
      country: {
        type: "string",
        description: "Country code (e.g., DE, US)"
      },
      state: {
        type: "string",
        description: "State/Province"
      }
    },
    required: []
  }
};

/**
 * Tool for deleting user account
 */
export const mittwald_user_delete_account: Tool = {
  name: "mittwald_user_delete_account",
  description: "Delete the current user's account and all associated personal data. This action is irreversible!",
  inputSchema: {
    type: "object",
    properties: {
      confirmation: {
        type: "string",
        description: "Type 'DELETE' to confirm account deletion",
        enum: ["DELETE"]
      },
      password: {
        type: "string",
        description: "Current password to confirm deletion"
      }
    },
    required: ["confirmation", "password"]
  }
};

/**
 * Success messages
 */
export const profileMessages = {
  getSuccess: "Successfully retrieved user profile.",
  updateSuccess: "Successfully updated user profile.",
  personalInfoSuccess: "Successfully retrieved personal information.",
  updatePersonalSuccess: "Successfully updated personal information.",
  deleteSuccess: "Account has been scheduled for deletion. You will receive a confirmation email."
};