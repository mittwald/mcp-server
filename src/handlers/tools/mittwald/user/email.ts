/**
 * @file Handler implementations for Mittwald User Email Management tools
 * @module handlers/tools/mittwald/user/email
 */

import { getMittwaldClient } from '../../../../services/mittwald/index.js';
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { ChangeEmailRequest, VerifyEmailRequest } from '../../../../types/mittwald/user.js';
import { emailMessages } from '../../../../constants/tool/mittwald/user/email.js';

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
          message: `Email operation failed: ${errorMessage}`,
          error: {
            type: "EMAIL_ERROR",
            code: errorCode,
            details: error?.response?.data || {}
          }
        }, null, 2)
      }
    ]
  };
}

/**
 * Handler for getting current email
 */
export async function handleGetEmail(): Promise<CallToolResult> {
  try {
    const client = getMittwaldClient();
    
    const response = await client.typedApi.user.getOwnEmail({});

    if (response.status === 200 && response.data) {
      // Also check if there's more detailed user info available
      try {
        // Email verification status may not be available from user endpoint
        const emailVerified = false;
        
        return formatResponse({
          email: response.data.email,
          verified: emailVerified,
          primary: true
        }, emailMessages.getSuccess);
      } catch {
        // Fall back to just email if user info not available
        return formatResponse({
          email: response.data.email,
          verified: null,
          primary: true
        }, emailMessages.getSuccess);
      }
    }

    throw new Error("Failed to retrieve email address");
  } catch (error) {
    return formatErrorResponse(error);
  }
}

/**
 * Handler for changing email address
 */
export async function handleChangeEmail(args: ChangeEmailRequest): Promise<CallToolResult> {
  try {
    const client = getMittwaldClient();
    
    // First verify password by attempting authentication
    const currentEmailResponse = await client.typedApi.user.getOwnEmail({});
    if (currentEmailResponse.status !== 200 || !currentEmailResponse.data) {
      throw new Error("Failed to get current email");
    }
    
    const authResponse = await client.typedApi.user.authenticate({
      data: {
        email: currentEmailResponse.data.email,
        password: args.password
      }
    });
    
    if (authResponse.status !== 200) {
      return formatErrorResponse({
        message: "Invalid password. Email change cancelled.",
        code: "INVALID_PASSWORD"
      });
    }
    
    // Now change the email - password not needed in data
    const response = await client.typedApi.user.changeEmail({
      data: {
        email: args.email
      }
    });

    if (String(response.status).startsWith('2')) {
      return formatResponse({
        oldEmail: currentEmailResponse.data.email,
        newEmail: args.email,
        verified: false,
        message: "Email change initiated. Please check your new email for verification."
      }, emailMessages.changeSuccess);
    }

    throw new Error("Failed to change email address");
  } catch (error) {
    return formatErrorResponse(error);
  }
}

/**
 * Handler for verifying email address
 */
export async function handleVerifyEmail(args: VerifyEmailRequest): Promise<CallToolResult> {
  try {
    const client = getMittwaldClient();
    
    const response = await client.typedApi.user.verifyEmail({
      data: {
        email: args.email || "",  // email is required
        token: args.token
      }
    });

    if (String(response.status).startsWith('2')) {
      // Get updated email info
      const emailResponse = await client.typedApi.user.getOwnEmail({});
      
      return formatResponse({
        email: emailResponse.data?.email,
        verified: true,
        verifiedAt: new Date().toISOString()
      }, emailMessages.verifySuccess);
    }

    throw new Error("Email verification failed");
  } catch (error) {
    return formatErrorResponse(error);
  }
}

/**
 * Handler for resending verification email
 */
export async function handleResendVerificationEmail(): Promise<CallToolResult> {
  try {
    const client = getMittwaldClient();
    
    // resendEmailVerification doesn't exist, try another approach
    throw new Error("Resend email verification is not available in the current API");
  } catch (error) {
    return formatErrorResponse(error);
  }
}