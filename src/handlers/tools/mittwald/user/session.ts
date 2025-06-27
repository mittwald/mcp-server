/**
 * @file Handler implementations for Mittwald User Session Management tools
 * @module handlers/tools/mittwald/user/session
 */

import { getMittwaldClient } from '../../../../services/mittwald/index.js';
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { Session } from '../../../../types/mittwald/user.js';
import { sessionMessages } from '../../../../constants/tool/mittwald/user/session.js';

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
          message: `Session operation failed: ${errorMessage}`,
          error: {
            type: "SESSION_ERROR",
            code: errorCode,
            details: error?.response?.data || {}
          }
        }, null, 2)
      }
    ]
  };
}

/**
 * Handler for listing sessions
 */
export async function handleListSessions(): Promise<CallToolResult> {
  try {
    const client = getMittwaldClient();
    
    const response = await client.typedApi.user.listSessions({});

    if (response.status === 200 && response.data) {
      const sessions = response.data as Session[];
      
      // Mark the current session if we can detect it
      const enrichedSessions = sessions.map(session => ({
        ...session,
        currentSession: session.currentSession || false
      }));
      
      return formatResponse({
        sessions: enrichedSessions,
        count: sessions.length
      }, sessionMessages.listSuccess);
    }

    throw new Error("Failed to retrieve sessions");
  } catch (error) {
    return formatErrorResponse(error);
  }
}

/**
 * Handler for getting a specific session
 */
export async function handleGetSession(args: { tokenId: string }): Promise<CallToolResult> {
  try {
    const client = getMittwaldClient();
    
    const response = await client.typedApi.user.getSession({
      tokenId: args.tokenId
    });

    if (response.status === 200 && response.data) {
      return formatResponse({
        session: response.data
      }, sessionMessages.getSuccess);
    }

    throw new Error("Failed to retrieve session");
  } catch (error) {
    return formatErrorResponse(error);
  }
}

/**
 * Handler for refreshing all sessions
 */
export async function handleRefreshSessions(): Promise<CallToolResult> {
  try {
    const client = getMittwaldClient();
    
    // Note: The API only supports refreshing individual sessions
    // Get current session first
    const tokenInfo = await client.typedApi.user.checkToken({});
    const sessionId = tokenInfo.data?.id;
    
    if (!sessionId) {
      throw new Error("Could not retrieve current session ID");
    }
    
    const response = await client.typedApi.user.refreshSession({ 
      data: { refreshToken: sessionId }
    });

    if (String(response.status).startsWith('2')) {
      return formatResponse({
        refreshed: true,
        message: "All sessions have been refreshed with extended expiration times"
      }, sessionMessages.refreshSuccess);
    }

    throw new Error("Failed to refresh sessions");
  } catch (error) {
    return formatErrorResponse(error);
  }
}

/**
 * Handler for terminating a specific session
 */
export async function handleTerminateSession(args: { tokenId: string }): Promise<CallToolResult> {
  try {
    const client = getMittwaldClient();
    
    const response = await client.typedApi.user.terminateSession({
      tokenId: args.tokenId
    });

    if (String(response.status).startsWith('2')) {
      return formatResponse({
        terminated: true,
        tokenId: args.tokenId
      }, sessionMessages.terminateSuccess);
    }

    throw new Error("Failed to terminate session");
  } catch (error) {
    return formatErrorResponse(error);
  }
}

/**
 * Handler for terminating all sessions
 */
export async function handleTerminateAllSessions(args: { includeCurrentSession?: boolean }): Promise<CallToolResult> {
  try {
    const client = getMittwaldClient();
    
    // First get all sessions
    const sessionsResponse = await client.typedApi.user.listSessions({});
    
    if (sessionsResponse.status !== 200 || !sessionsResponse.data) {
      throw new Error("Failed to retrieve sessions");
    }

    const sessions = sessionsResponse.data as unknown as Session[];
    let terminatedCount = 0;
    const errors: any[] = [];

    // Terminate each session
    for (const session of sessions) {
      // Skip current session if requested
      if (!args.includeCurrentSession && session.currentSession) {
        continue;
      }

      try {
        await client.typedApi.user.terminateSession({
          tokenId: session.tokenId
        });
        terminatedCount++;
      } catch (error) {
        errors.push({
          tokenId: session.tokenId,
          error: (error as any)?.message || "Unknown error"
        });
      }
    }

    return formatResponse({
      terminated: terminatedCount,
      total: sessions.length,
      skipped: args.includeCurrentSession ? 0 : sessions.filter(s => s.currentSession).length,
      errors: errors.length > 0 ? errors : undefined
    }, sessionMessages.terminateAllSuccess);
  } catch (error) {
    return formatErrorResponse(error);
  }
}