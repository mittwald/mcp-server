/**
 * @file Handler for mittwald_login_token tool
 * @module handlers/tools/mittwald-cli/login
 */

import { MittwaldAPIV2Client } from '@mittwald/api-client';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';

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
): Promise<CallToolResult> {
  try {
    // In the MCP context, we assume the API token is already configured
    // We'll validate it by trying to get the current user
    const userResponse = await client.api.user.getOwnAccount();
    
    if (userResponse.status === 200 && userResponse.data) {
      const user = userResponse.data;
      
      if (args.quiet) {
        return formatToolResponse(
          'success',
          'Authenticated successfully',
          {
            authenticated: true,
            userId: user.userId,
          }
        );
      }
      
      return formatToolResponse(
        'success',
        `Successfully authenticated as ${user.email}`,
        {
          authenticated: true,
          userId: user.userId,
          email: user.email,
          customer: user.person || undefined,
        }
      );
    }
    
    return formatToolResponse(
      'error',
      'Authentication failed - invalid or missing API token'
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (args.quiet) {
      return formatToolResponse(
        'error',
        'Authentication failed'
      );
    }
    
    return formatToolResponse(
      'error',
      `Authentication failed: ${errorMessage}`
    );
  }
}