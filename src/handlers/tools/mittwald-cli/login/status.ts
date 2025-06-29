/**
 * @file Handler for mittwald_login_status tool
 * @module handlers/tools/mittwald-cli/login
 */

import { MittwaldAPIV2Client } from '@mittwald/api-client';
import { ToolResponse } from '../../../../types/tool-response.js';

/**
 * Checks your current authentication status
 * 
 * @returns Authentication status information
 */
export async function handleMittwaldLoginStatus(
  client: MittwaldAPIV2Client,
  _args: Record<string, never>
): Promise<ToolResponse> {
  try {
    // Try to get the current user to verify authentication
    const userResponse = await client.user.api.user.getOwnAccount();
    
    if (userResponse.status === 200 && userResponse.data) {
      const user = userResponse.data;
      return {
        success: true,
        data: {
          authenticated: true,
          userId: user.userId,
          email: user.email,
          phoneNumber: user.phoneNumber,
          customer: user.person || undefined,
        },
      };
    }
    
    return {
      success: false,
      error: 'Not authenticated',
    };
  } catch (error) {
    // If we get a 401 or similar, we're not authenticated
    return {
      success: false,
      error: 'Not authenticated',
    };
  }
}