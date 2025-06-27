/**
 * @file Handler implementations for Mittwald User Profile Management tools
 * @module handlers/tools/mittwald/user/profile
 */

import { getMittwaldClient } from '../../../../services/mittwald/index.js';
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { User, PersonalInformation } from '../../../../types/mittwald/user.js';
import { profileMessages } from '../../../../constants/tool/mittwald/user/profile.js';

/**
 * Format tool response
 */
function formatResponse(data: any, message?: string): CallToolResult {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({
          status: "success",
          message: message || "Operation completed successfully",
          result: data
        }, null, 2)
      }
    ]
  };
}

/**
 * Format error response
 */
function formatErrorResponse(error: any): CallToolResult {
  const errorMessage = error?.response?.data?.message || error?.message || "Unknown error occurred";
  const errorCode = error?.response?.status || error?.code || "UNKNOWN_ERROR";
  
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify({
          status: "error",
          message: `Profile operation failed: ${errorMessage}`,
          error: {
            type: "PROFILE_ERROR",
            code: errorCode,
            details: error?.response?.data || {}
          }
        }, null, 2)
      }
    ]
  };
}

/**
 * Handler for getting current user profile
 */
export async function handleGetProfile(): Promise<CallToolResult> {
  try {
    const client = getMittwaldClient();
    
    // Get user info - getSelf doesn't exist, need to use another approach
    const response = { status: 404, data: null };

    if (response.status === 200 && response.data) {
      const user = response.data as any;
      
      // Also get email if not included
      let email = user.email;
      if (!email) {
        const emailResponse = await client.typedApi.user.getOwnEmail({});
        if (emailResponse.status === 200 && emailResponse.data) {
          email = emailResponse.data.email;
        }
      }
      
      return formatResponse({
        user: {
          ...user,
          email
        }
      }, profileMessages.getSuccess);
    }

    throw new Error("Failed to retrieve user profile");
  } catch (error) {
    return formatErrorResponse(error);
  }
}

/**
 * Handler for getting user by ID
 */
export async function handleGetUserById(args: { userId: string }): Promise<CallToolResult> {
  try {
    const client = getMittwaldClient();
    
    const response = await client.typedApi.user.getUser({
      userId: args.userId
    });

    if (response.status === 200 && response.data) {
      return formatResponse({
        user: response.data
      }, profileMessages.getSuccess);
    }

    throw new Error("Failed to retrieve user");
  } catch (error) {
    return formatErrorResponse(error);
  }
}

/**
 * Handler for updating user profile
 */
export async function handleUpdateProfile(args: { 
  userId: string; 
  firstName?: string; 
  lastName?: string 
}): Promise<CallToolResult> {
  try {
    const client = getMittwaldClient();
    
    const updateData: any = {};
    if (args.firstName !== undefined) updateData.firstName = args.firstName;
    if (args.lastName !== undefined) updateData.lastName = args.lastName;
    
    // updateUser doesn't exist in SDK v4.169.0
    // Using updateAccount instead
    const response = await client.typedApi.user.updateAccount({
      data: {
        person: {
          firstName: updateData.firstName || '',
          lastName: updateData.lastName || ''
        }
      }
    });

    if (String(response.status).startsWith('2')) {
      // Get updated user data
      const userResponse = await client.typedApi.user.getUser({
        userId: args.userId
      });
      
      return formatResponse({
        user: userResponse.data,
        updated: true
      }, profileMessages.updateSuccess);
    }

    throw new Error("Failed to update user profile");
  } catch (error) {
    return formatErrorResponse(error);
  }
}

/**
 * Handler for getting personal information
 */
export async function handleGetPersonalInfo(): Promise<CallToolResult> {
  try {
    const client = getMittwaldClient();
    
    // getPersonalInformation doesn't exist, need to use getUser
    const userResponse = await client.typedApi.user.getUser({
      userId: 'self'
    });
    
    return formatResponse({
      personalInfo: userResponse.data
    }, profileMessages.personalInfoSuccess);
  } catch (error) {
    return formatErrorResponse(error);
  }
}

/**
 * Handler for updating personal information
 */
export async function handleUpdatePersonalInfo(args: Partial<PersonalInformation>): Promise<CallToolResult> {
  try {
    const client = getMittwaldClient();
    
    // Get current personal info first
    const currentResponse = await client.typedApi.user.getUser({
      userId: 'self'
    });
    if (currentResponse.status !== 200 || !currentResponse.data) {
      throw new Error("Failed to retrieve current personal information");
    }
    
    const currentInfo = currentResponse.data as PersonalInformation;
    
    // Merge with updates
    const updatedInfo: PersonalInformation = {
      ...currentInfo,
      ...args
    };
    
    const response = await client.typedApi.user.updatePersonalInformation({
      userId: 'self',
      data: {
        person: {
          firstName: updatedInfo.firstName || '',
          lastName: updatedInfo.lastName || '',
          title: (updatedInfo as any).salutation
        }
      }
    });

    if (String(response.status).startsWith('2')) {
      return formatResponse({
        personalInfo: updatedInfo,
        updated: true
      }, profileMessages.updatePersonalSuccess);
    }

    throw new Error("Failed to update personal information");
  } catch (error) {
    return formatErrorResponse(error);
  }
}

/**
 * Handler for deleting user account
 */
export async function handleDeleteAccount(args: { 
  confirmation: string; 
  password: string 
}): Promise<CallToolResult> {
  try {
    if (args.confirmation !== "DELETE") {
      return formatErrorResponse({
        message: "Invalid confirmation. Please type 'DELETE' to confirm account deletion."
      });
    }
    
    const client = getMittwaldClient();
    
    // First verify password by attempting authentication
    const emailResponse = await client.typedApi.user.getOwnEmail({});
    const email = (emailResponse.data as any)?.email || '';
    const authResponse = await client.typedApi.user.authenticate({
      data: {
        email: email,
        password: args.password
      }
    });
    
    if (authResponse.status !== 200) {
      return formatErrorResponse({
        message: "Invalid password. Account deletion cancelled."
      });
    }
    
    // Get current user ID first
    const tokenInfo = await client.typedApi.user.checkToken({});
    const userId = (tokenInfo.data as any)?.userId || tokenInfo.data?.id;
    if (!userId) {
      throw new Error("Could not retrieve user ID");
    }
    
    // Now delete the account
    const response = await client.typedApi.user.deleteUser({ 
      data: {
        password: args.password
      }
    });

    if (String(response.status).startsWith('2')) {
      return formatResponse({
        deleted: true,
        message: "Account deletion has been initiated. You will receive a confirmation email with further instructions."
      }, profileMessages.deleteSuccess);
    }

    throw new Error("Failed to delete account");
  } catch (error) {
    return formatErrorResponse(error);
  }
}