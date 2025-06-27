/**
 * @file Handler implementations for Mittwald User Authentication tools
 * @module handlers/tools/mittwald/user/auth
 */

import { getMittwaldClient } from '../../../../services/mittwald/index.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { 
  AuthenticateRequest, 
  AuthenticateMfaRequest,
  AuthenticateSessionTokenRequest,
  AuthenticateTokenRetrievalKeyRequest
} from '../../../../types/mittwald/user.js';
import { 
  authSuccessMessage, 
  mfaSuccessMessage, 
  tokenCheckSuccessMessage 
} from '../../../../constants/tool/mittwald/user/auth.js';

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
          message: `Authentication failed: ${errorMessage}`,
          error: {
            type: "AUTHENTICATION_ERROR",
            code: errorCode,
            details: error?.response?.data || {}
          }
        }, null, 2)
      }
    ]
  };
}

/**
 * Handler for basic authentication
 */
export async function handleAuthenticate(args: AuthenticateRequest): Promise<CallToolResult> {
  try {
    const client = getMittwaldClient();
    
    // Call the authenticate endpoint
    const response = await client.api.user.authenticate({
      data: {
        email: args.email,
        password: args.password
      }
    });

    if (response.status === 200 && response.data) {
      // Store the token in the client for future requests
      const newClient = getMittwaldClient(response.data.token);
      
      return formatResponse({
        token: response.data.token,
        expiresAt: response.data.expiresAt,
        requiresMfa: false
      }, authSuccessMessage);
    } else if (response.status === 202) {
      // MFA required
      return formatResponse({
        requiresMfa: true,
        authenticationToken: response.data.authenticationToken,
        message: "Multi-factor authentication required. Please provide your MFA code."
      }, "MFA required to complete authentication");
    }

    throw new Error("Unexpected response from authentication endpoint");
  } catch (error) {
    return formatErrorResponse(error);
  }
}

/**
 * Handler for multi-factor authentication
 */
export async function handleAuthenticateMfa(args: AuthenticateMfaRequest): Promise<CallToolResult> {
  try {
    const client = getMittwaldClient();
    
    const response = await client.api.user.authenticateMfa({
      data: {
        authenticationToken: args.authenticationToken,
        multiFactorCode: args.multiFactorCode
      }
    });

    if (response.status === 200 && response.data) {
      // Store the token in the client for future requests
      const newClient = getMittwaldClient(response.data.token);
      
      return formatResponse({
        token: response.data.token,
        expiresAt: response.data.expiresAt
      }, mfaSuccessMessage);
    }

    throw new Error("MFA authentication failed");
  } catch (error) {
    return formatErrorResponse(error);
  }
}

/**
 * Handler for session token authentication
 */
export async function handleAuthenticateSessionToken(args: AuthenticateSessionTokenRequest): Promise<CallToolResult> {
  try {
    const client = getMittwaldClient();
    
    const response = await client.api.user.authenticateWithSessionToken({
      data: {
        sessionToken: args.sessionToken
      }
    });

    if (response.status === 200 && response.data) {
      // Store the token in the client for future requests
      const newClient = getMittwaldClient(response.data.token);
      
      return formatResponse({
        token: response.data.token,
        expiresAt: response.data.expiresAt
      }, "Successfully authenticated with session token");
    }

    throw new Error("Session token authentication failed");
  } catch (error) {
    return formatErrorResponse(error);
  }
}

/**
 * Handler for token retrieval key authentication
 */
export async function handleAuthenticateTokenRetrievalKey(args: AuthenticateTokenRetrievalKeyRequest): Promise<CallToolResult> {
  try {
    const client = getMittwaldClient();
    
    const response = await client.api.user.authenticateWithTokenRetrievalKey({
      data: {
        tokenRetrievalKey: args.tokenRetrievalKey
      }
    });

    if (response.status === 200 && response.data) {
      // Store the token in the client for future requests
      const newClient = getMittwaldClient(response.data.token);
      
      return formatResponse({
        token: response.data.token,
        expiresAt: response.data.expiresAt
      }, "Successfully authenticated with token retrieval key");
    }

    throw new Error("Token retrieval key authentication failed");
  } catch (error) {
    return formatErrorResponse(error);
  }
}

/**
 * Handler for checking token validity
 */
export async function handleCheckToken(): Promise<CallToolResult> {
  try {
    const client = getMittwaldClient();
    
    // Try to get user info to validate token
    const response = await client.api.user.getOwnEmail({});
    
    if (response.status === 200 && response.data) {
      // Also try to get more user info
      const userResponse = await client.api.user.getSelf({});
      
      return formatResponse({
        valid: true,
        email: response.data.email,
        user: userResponse.data
      }, tokenCheckSuccessMessage);
    }

    throw new Error("Token is invalid or expired");
  } catch (error) {
    return formatErrorResponse(error);
  }
}