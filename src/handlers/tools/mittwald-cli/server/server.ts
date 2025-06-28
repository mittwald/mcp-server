import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';

interface MittwaldServerArgs {}

export const handleServer: MittwaldToolHandler<MittwaldServerArgs> = async (args, { mittwaldClient }) => {
  try {
    const helpText = `Server Management Commands

Available server operations:
- get: Get a server
- list: List servers for an organization or user

Use the specific server tools available in this MCP server to perform these operations:
- mittwald_server_get: Get detailed information about a specific server
- mittwald_server_list: List all servers you have access to with various output formats

Server management allows you to view and monitor your hosting infrastructure.`;

    return formatToolResponse('success', helpText);
    
  } catch (error) {
    return formatToolResponse(
      'error',
      `Failed to get server command help: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};