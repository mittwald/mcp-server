/**
 * @file Handler implementations for Mittwald User Email Management tools
 * @module handlers/tools/mittwald/user/email
 */

import { getMittwaldClient } from '../../../../services/mittwald/index.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
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
    
    const response = await client.api.user.getOwnEmail({});

    if (response.status === 200 && response.data) {
      // Also check if there's more detailed user info available
      try {
        const userResponse = await client.api.user.getSelf({});
        const emailVerified = userResponse.data?.emailVerified || false;
        
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
    const currentEmailResponse = await client.api.user.getOwnEmail({});
    if (currentEmailResponse.status !== 200 || !currentEmailResponse.data) {
      throw new Error("Failed to get current email");
    }
    
    const authResponse = await client.api.user.authenticate({
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
    
    // Now change the email
    const response = await client.api.user.changeEmail({
      data: {
        email: args.email,
        password: args.password
      }
    });

    if (response.status === 200 || response.status === 204) {
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
    
    const response = await client.api.user.verifyEmail({
      data: {
        token: args.token
      }
    });

    if (response.status === 200 || response.status === 204) {
      // Get updated email info
      const emailResponse = await client.api.user.getOwnEmail({});
      
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
    
    const response = await client.api.user.resendEmailVerification({});

    if (response.status === 200 || response.status === 204) {
      // Get current email to show which address verification was sent to
      const emailResponse = await client.api.user.getOwnEmail({});
      
      return formatResponse({
        email: emailResponse.data?.email,
        sent: true,
        sentAt: new Date().toISOString()
      }, emailMessages.resendSuccess);
    }

    throw new Error("Failed to resend verification email");
  } catch (error) {
    return formatErrorResponse(error);
  }
}