import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';

interface MittwaldServerListArgs {
  output: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
  extended?: boolean;
  noHeader?: boolean;
  noTruncate?: boolean;
  noRelativeDates?: boolean;
  csvSeparator?: ',' | ';';
}

export const handleServerList: MittwaldToolHandler<MittwaldServerListArgs> = async (args, { mittwaldClient }) => {
  try {
    // List servers using the Mittwald API
    const servers = await mittwaldClient.api.project.listServers({});

    if (!servers.data || servers.data.length === 0) {
      return formatToolResponse(
        'success',
        'No servers found.'
      );
    }

    // Format response based on output type
    if (args.output === 'json') {
      return formatToolResponse(
        'success',
        'Server list retrieved',
        servers.data
      );
    } else if (args.output === 'yaml') {
      // Simple YAML-like formatting
      const yamlOutput = (servers.data as any[]).map((server: any, index: number) => {
        return `- server_${index}:\n` + 
          Object.entries(server)
            .map(([key, value]) => `    ${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`)
            .join('\n');
      }).join('\n');
      return formatToolResponse('success', 'Server list (YAML format)', {yaml: yamlOutput});
    } else if (args.output === 'csv' || args.output === 'tsv') {
      const separator = args.output === 'csv' ? (args.csvSeparator || ',') : '\t';
      
      // Get all unique keys for headers
      const allKeys = [...new Set((servers.data as any[]).flatMap((server: any) => Object.keys(server)))];
      
      let output = '';
      if (!args.noHeader) {
        output += allKeys.join(separator) + '\n';
      }
      
      output += (servers.data as any[]).map((server: any) => 
        allKeys.map(key => {
          const value = server[key];
          return typeof value === 'object' ? JSON.stringify(value) : (value || '');
        }).join(separator)
      ).join('\n');
      
      return formatToolResponse('success', `Server list (${args.output.toUpperCase()} format)`, {data: output});
    } else {
      // Default txt format
      let responseText = '';
      
      if (!args.noHeader) {
        responseText += 'SERVER LIST\n';
        responseText += '===========\n\n';
      }
      
      (servers.data as any[]).forEach((server: any, index: number) => {
        responseText += `Server ${index + 1}:\n`;
        responseText += `  ID: ${server.id}\n`;
        responseText += `  Description: ${server.description || 'N/A'}\n`;
        responseText += `  Created: ${server.createdAt || 'N/A'}\n`;
        responseText += `  Ready: ${server.isReady ? 'Yes' : 'No'}\n`;
        
        if (args.extended) {
          // Add more details in extended mode
          Object.entries(server).forEach(([key, value]) => {
            if (!['id', 'description', 'createdAt', 'isReady'].includes(key)) {
              responseText += `  ${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}\n`;
            }
          });
        }
        
        responseText += '\n';
      });

      return formatToolResponse('success', responseText);
    }
    
  } catch (error) {
    return formatToolResponse(
      'error',
      `Failed to list servers: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};