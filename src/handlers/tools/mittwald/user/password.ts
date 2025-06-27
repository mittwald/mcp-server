/**
 * @file Handler implementations for Mittwald User Password Management tools
 * @module handlers/tools/mittwald/user/password
 */

import { getMittwaldClient } from '../../../../services/mittwald/index.js';
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { 
  ChangePasswordRequest, 
  InitPasswordResetRequest, 
  ConfirmPasswordResetRequest 
} from '../../../../types/mittwald/user.js';
import { passwordMessages } from '../../../../constants/tool/mittwald/user/password.js';

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
          message: `Password operation failed: ${errorMessage}`,
          error: {
            type: "PASSWORD_ERROR",
            code: errorCode,
            details: error?.response?.data || {}
          }
        }, null, 2)
      }
    ]
  };
}

/**
 * Handler for changing password
 */
export async function handleChangePassword(args: ChangePasswordRequest): Promise<CallToolResult> {
  try {
    const client = getMittwaldClient();
    
    // First verify the old password
    const emailResponse = await client.typedApi.user.getOwnEmail({});
    if (emailResponse.status !== 200 || !emailResponse.data) {
      throw new Error("Failed to get current email");
    }
    
    const authResponse = await client.typedApi.user.authenticate({
      data: {
        email: emailResponse.data.email,
        password: args.oldPassword
      }
    });
    
    if (authResponse.status !== 200) {
      return formatErrorResponse({
        message: "Current password is incorrect.",
        code: "INVALID_PASSWORD"
      });
    }
    
    // Now change the password
    const response = await client.typedApi.user.changePassword({
      data: {
        oldPassword: args.oldPassword,
        newPassword: args.newPassword
      }
    });

    if (String(response.status).startsWith('2')) {
      return formatResponse({
        changed: true,
        changedAt: new Date().toISOString()
      }, passwordMessages.changeSuccess);
    }

    throw new Error("Failed to change password");
  } catch (error) {
    return formatErrorResponse(error);
  }
}

/**
 * Handler for getting password last updated timestamp
 */
export async function handleGetPasswordUpdatedAt(): Promise<CallToolResult> {
  try {
    const client = getMittwaldClient();
    
    const response = await client.typedApi.user.getPasswordUpdatedAt({});

    if (response.status === 200 && response.data) {
      return formatResponse({
        passwordUpdatedAt: response.data.passwordUpdatedAt,
        lastUpdate: response.data.passwordUpdatedAt
      }, passwordMessages.getUpdatedAtSuccess);
    }

    // Fallback: return a default response
    // Password update timestamp may not be available

    throw new Error("Failed to retrieve password update timestamp");
  } catch (error) {
    return formatErrorResponse(error);
  }
}

/**
 * Handler for initiating password reset
 */
export async function handleInitPasswordReset(args: InitPasswordResetRequest): Promise<CallToolResult> {
  try {
    const client = getMittwaldClient();
    
    const response = await client.typedApi.user.initPasswordReset({
      data: {
        email: args.email
      }
    });

    if (String(response.status).startsWith('2')) {
      return formatResponse({
        email: args.email,
        resetInitiated: true,
        initiatedAt: new Date().toISOString(),
        message: "If an account with this email exists, a password reset link has been sent."
      }, passwordMessages.initResetSuccess);
    }

    throw new Error("Failed to initiate password reset");
  } catch (error) {
    return formatErrorResponse(error);
  }
}

/**
 * Handler for confirming password reset
 */
export async function handleConfirmPasswordReset(args: ConfirmPasswordResetRequest): Promise<CallToolResult> {
  try {
    const client = getMittwaldClient();
    
    const response = await client.typedApi.user.confirmPasswordReset({
      data: {
        token: args.token,
        password: args.password,
        userId: args.userId || ""  // userId may be required
      }
    });

    if (String(response.status).startsWith('2')) {
      return formatResponse({
        resetCompleted: true,
        completedAt: new Date().toISOString(),
        message: "Password has been successfully reset. You can now log in with your new password."
      }, passwordMessages.confirmResetSuccess);
    }

    throw new Error("Password reset confirmation failed");
  } catch (error) {
    return formatErrorResponse(error);
  }
}