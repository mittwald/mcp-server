/**
 * @file Handler for mittwald_login_status tool
 * @module handlers/tools/mittwald-cli/login
 */

import { MittwaldAPIV2Client } from '@mittwald/api-client';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';

/**
 * Checks your current authentication status
 * 
 * @returns Authentication status information
 */
export async function handleMittwaldLoginStatus(
  client: MittwaldAPIV2Client,
  _args: Record<string, never>
): Promise<CallToolResult> {
  try {
    // Try to get the current user to verify authentication
    const userResponse = await client.user.getUser({ userId: "self" });
    
    if (userResponse.status === 200 && userResponse.data) {
      const user = userResponse.data;
      return formatToolResponse(
        'success',
        `Authenticated as ${user.email}`,
        {
          authenticated: true,
          userId: user.userId,
          email: user.email,
          phoneNumber: user.phoneNumber,
          customer: user.person || undefined,
        }
      );
    }
    
    return formatToolResponse(
      'error',
      'Not authenticated'
    );
  } catch (error) {
    // If we get a 401 or similar, we're not authenticated
    return formatToolResponse(
      'error',
      'Not authenticated'
    );
  }
}