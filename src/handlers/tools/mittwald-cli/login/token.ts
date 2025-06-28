/**
 * @file Handler for mittwald_login_token tool
 * @module handlers/tools/mittwald-cli/login
 */

import { MittwaldAPIV2Client } from '@mittwald/api-client';
import { ToolResponse } from '../../../types/tool-response.js';

/**
 * Authenticate using an API token
 * 
 * @param client - The Mittwald API client
 * @param args - Tool arguments
 * @returns Authentication result
 */
export async function handleMittwaldLoginToken(
  client: MittwaldAPIV2Client,
  args: {
    overwrite?: boolean;
    quiet?: boolean;
  }
): Promise<ToolResponse> {
  try {
    // In the MCP context, we assume the API token is already configured
    // We'll validate it by trying to get the current user
    const userResponse = await client.user.getOwnAccount();
    
    if (userResponse.status === 200 && userResponse.data) {
      const user = userResponse.data;
      
      if (args.quiet) {
        return {
          success: true,
          data: {
            authenticated: true,
            userId: user.userId,
          },
        };
      }
      
      return {
        success: true,
        data: {
          authenticated: true,
          message: `Successfully authenticated as ${user.email}`,
          userId: user.userId,
          email: user.email,
          customer: user.person || undefined,
        },
      };
    }
    
    return {
      success: false,
      error: 'Authentication failed - invalid or missing API token',
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (args.quiet) {
      return {
        success: false,
        error: 'Authentication failed',
      };
    }
    
    return {
      success: false,
      error: `Authentication failed: ${errorMessage}`,
    };
  }
}