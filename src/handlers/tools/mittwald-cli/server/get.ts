import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';

interface MittwaldServerGetArgs {
  serverId?: string;
  output: 'txt' | 'json' | 'yaml';
}

export const handleServerGet: MittwaldToolHandler<MittwaldServerGetArgs> = async (args, { mittwaldClient }) => {
  try {
    if (!args.serverId) {
      return formatToolResponse(
        'error',
        'Server ID is required to get server information.'
      );
    }

    // Get server details using the Mittwald API
    const server = await mittwaldClient.project.getServer({
      serverId: args.serverId
    });

    if (!server.data) {
      return formatToolResponse(
        'error',
        `Server with ID ${args.serverId} not found.`
      );
    }

    // Format response based on output type
    if (args.output === 'json') {
      return formatToolResponse(
        'success',
        'Server information retrieved',
        server.data
      );
    } else if (args.output === 'yaml') {
      // Simple YAML-like formatting
      const yamlOutput = Object.entries(server.data)
        .map(([key, value]) => `${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`)
        .join('\n');
      return formatToolResponse('success', 'Server information (YAML format)', {yaml: yamlOutput});
    } else {
      // Default txt format
      const responseText = `Server Information:

Server ID: ${server.data.id}
Description: ${server.data.description || 'N/A'}
Created: ${server.data.createdAt || 'N/A'}
Ready: ${server.data.isReady ? 'Yes' : 'No'}
Status: ${server.data.isReady ? 'Ready' : 'Not Ready'}`;

      return formatToolResponse('success', responseText);
    }
    
  } catch (error) {
    return formatToolResponse(
      'error',
      `Failed to get server information: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};