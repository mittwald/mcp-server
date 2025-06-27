/**
 * @file Tool definitions for Mittwald User Authentication
 * @module constants/tool/mittwald/user/auth
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';

/**
 * Tool for authenticating with email and password
 */
export const mittwald_user_authenticate: Tool = {
  name: "mittwald_user_authenticate",
  description: "Authenticate with Mittwald using email and password to obtain an access token. This is the primary authentication method for users.",
  inputSchema: {
    type: "object",
    properties: {
      email: {
        type: "string",
        description: "The user's email address",
        format: "email"
      },
      password: {
        type: "string",
        description: "The user's password"
      }
    },
    required: ["email", "password"]
  }
};

/**
 * Tool for multi-factor authentication
 */
export const mittwald_user_authenticate_mfa: Tool = {
  name: "mittwald_user_authenticate_mfa",
  description: "Complete multi-factor authentication by providing a TOTP code or SMS code after initial authentication.",
  inputSchema: {
    type: "object",
    properties: {
      authenticationToken: {
        type: "string",
        description: "The temporary authentication token received from initial login"
      },
      multiFactorCode: {
        type: "string",
        description: "The 6-digit MFA code from authenticator app or SMS"
      }
    },
    required: ["authenticationToken", "multiFactorCode"]
  }
};

/**
 * Tool for authenticating with session token
 */
export const mittwald_user_authenticate_session_token: Tool = {
  name: "mittwald_user_authenticate_session_token",
  description: "Authenticate an external application using a session token. This is used for integrations and third-party applications.",
  inputSchema: {
    type: "object",
    properties: {
      sessionToken: {
        type: "string",
        description: "The session token provided by the external application"
      }
    },
    required: ["sessionToken"]
  }
};

/**
 * Tool for authenticating with token retrieval key
 */
export const mittwald_user_authenticate_token_retrieval_key: Tool = {
  name: "mittwald_user_authenticate_token_retrieval_key",
  description: "Authenticate using a token retrieval key to obtain an access token. This is typically used for automated processes and CI/CD pipelines.",
  inputSchema: {
    type: "object",
    properties: {
      tokenRetrievalKey: {
        type: "string",
        description: "The token retrieval key"
      }
    },
    required: ["tokenRetrievalKey"]
  }
};

/**
 * Tool for checking token validity
 */
export const mittwald_user_check_token: Tool = {
  name: "mittwald_user_check_token",
  description: "Check if the current authentication token is still valid and get information about the authenticated user.",
  inputSchema: {
    type: "object",
    properties: {},
    required: []
  }
};

/**
 * Success message for authentication
 */
export const authSuccessMessage = "Successfully authenticated with Mittwald. The access token has been stored for subsequent API calls.";

/**
 * Success message for MFA
 */
export const mfaSuccessMessage = "Multi-factor authentication completed successfully. You are now fully authenticated.";

/**
 * Success message for token check
 */
export const tokenCheckSuccessMessage = "Token is valid. User information retrieved successfully.";