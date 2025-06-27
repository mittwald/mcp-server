/**
 * @file Unified handler for all Mittwald User API operations
 * @module handlers/tools/mittwald/user/unified-handler
 */

import { getMittwaldClient } from '../../../../services/mittwald/index.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

/**
 * Format success response
 */
function formatResponse(data: any, message?: string): CallToolResult {
  return {
    content: [{
      type: "text",
      text: JSON.stringify({
        status: "success",
        message: message || "Operation completed successfully",
        result: data
      }, null, 2)
    }]
  };
}

/**
 * Format error response
 */
function formatErrorResponse(error: any): CallToolResult {
  const errorMessage = error?.response?.data?.message || error?.message || "Unknown error occurred";
  const errorCode = error?.response?.status || error?.code || "UNKNOWN_ERROR";
  
  return {
    content: [{
      type: "text",
      text: JSON.stringify({
        status: "error",
        message: `Operation failed: ${errorMessage}`,
        error: { type: "MITTWALD_API_ERROR", code: errorCode, details: error?.response?.data || {} }
      }, null, 2)
    }]
  };
}

/**
 * Generic handler that routes to appropriate Mittwald API endpoints
 */
export async function handleMittwaldUserTool(toolName: string, args: any): Promise<CallToolResult> {
  try {
    const client = getMittwaldClient();
    
    // Route based on tool name
    switch (toolName) {
      // SSH Keys
      case "mittwald_user_list_ssh_keys":
        const sshKeysResponse = await client.api.user.listSshKeys({});
        return formatResponse({ sshKeys: sshKeysResponse.data });
        
      case "mittwald_user_create_ssh_key":
        const createSshResponse = await client.api.user.createSshKey({ data: args });
        return formatResponse({ sshKey: createSshResponse.data });
        
      case "mittwald_user_delete_ssh_key":
        await client.api.user.deleteSshKey({ sshKeyId: args.sshKeyId });
        return formatResponse({ deleted: true });
        
      // MFA
      case "mittwald_user_get_mfa_status":
        const mfaResponse = await client.api.user.getMfaStatus({});
        return formatResponse({ mfaStatus: mfaResponse.data });
        
      case "mittwald_user_init_mfa":
        const initMfaResponse = await client.api.user.initMfa({ data: args });
        return formatResponse({ mfaInit: initMfaResponse.data });
        
      // Support
      case "mittwald_user_create_feedback":
        const feedbackResponse = await client.api.user.createFeedback({ data: args });
        return formatResponse({ feedback: feedbackResponse.data });
        
      case "mittwald_user_get_support_code":
        const supportCodeResponse = await client.api.user.getSupportCode({});
        return formatResponse({ supportCode: supportCodeResponse.data });
        
      // Phone
      case "mittwald_user_add_phone":
        const addPhoneResponse = await client.api.user.addPhone({ 
          userId: args.userId, 
          data: { phoneNumber: args.phoneNumber, primary: args.primary } 
        });
        return formatResponse({ phone: addPhoneResponse.data });
        
      case "mittwald_user_verify_phone":
        const verifyPhoneResponse = await client.api.user.verifyPhone({ 
          userId: args.userId, 
          data: { verificationCode: args.verificationCode } 
        });
        return formatResponse({ verified: true });
        
      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  } catch (error) {
    return formatErrorResponse(error);
  }
}

// Export individual handlers for compatibility
export const handleListSshKeys = () => handleMittwaldUserTool("mittwald_user_list_ssh_keys", {});
export const handleCreateSshKey = (args: any) => handleMittwaldUserTool("mittwald_user_create_ssh_key", args);
export const handleDeleteSshKey = (args: any) => handleMittwaldUserTool("mittwald_user_delete_ssh_key", args);
export const handleGetMfaStatus = () => handleMittwaldUserTool("mittwald_user_get_mfa_status", {});
export const handleInitMfa = (args: any) => handleMittwaldUserTool("mittwald_user_init_mfa", args);
export const handleCreateFeedback = (args: any) => handleMittwaldUserTool("mittwald_user_create_feedback", args);
export const handleGetSupportCode = () => handleMittwaldUserTool("mittwald_user_get_support_code", {});
export const handleAddPhone = (args: any) => handleMittwaldUserTool("mittwald_user_add_phone", args);
export const handleVerifyPhone = (args: any) => handleMittwaldUserTool("mittwald_user_verify_phone", args);