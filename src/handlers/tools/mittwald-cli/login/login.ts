/**
 * @file Handler for mittwald_login tool
 * @module handlers/tools/mittwald-cli/login
 */

import { MittwaldAPIV2Client } from '@mittwald/api-client';
import { ToolResponse } from '../../../../types/tool-response.js';

/**
 * Manage your client authentication - shows available login commands
 * 
 * @param _client - The Mittwald API client (unused for this command)
 * @param _args - Tool arguments (empty for this command)
 * @returns Available login commands information
 */
export async function handleMittwaldLogin(
  _client: MittwaldAPIV2Client,
  _args: Record<string, never>
): Promise<ToolResponse> {
  return {
    success: true,
    data: {
      description: 'Manage your client authentication',
      commands: [
        {
          command: 'mittwald_login_reset',
          description: 'Reset your local authentication state',
        },
        {
          command: 'mittwald_login_status', 
          description: 'Checks your current authentication status',
        },
        {
          command: 'mittwald_login_token',
          description: 'Authenticate using an API token',
        },
      ],
      usage: 'Use one of the specific login commands for authentication operations',
    },
  };
}