import type { MittwaldToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';

interface MittwaldUserApiTokenGetArgs {
  tokenId: string;
  output?: "txt" | "json" | "yaml";
}

export const handleUserApiTokenGet: MittwaldToolHandler<MittwaldUserApiTokenGetArgs> = async (args, { mittwaldClient }) => {
  try {
    // Get API token details from the API
    const result = await mittwaldClient.user.getApiToken({
      apiTokenId: args.tokenId
    });

    if (!result.data) {
      return formatToolResponse(
        "error",
        `API token not found: ${args.tokenId}`
      );
    }

    const token = result.data;
    
    // Format output based on requested format
    let formattedOutput;
    const outputFormat = args.output || 'txt';
    
    switch (outputFormat) {
      case 'json':
        formattedOutput = JSON.stringify(token, null, 2);
        break;
      case 'yaml':
        // Simple YAML-like output
        formattedOutput = Object.entries(token)
          .map(([key, value]) => `${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`)
          .join('\n');
        break;
      case 'txt':
      default:
        // Human-readable text output
        formattedOutput = `API Token Details:
ID: ${token.apiTokenId}
Description: ${token.description || 'N/A'}
Roles: ${Array.isArray(token.roles) ? token.roles.join(', ') : token.roles || 'N/A'}
Created: ${token.createdAt || 'N/A'}
Expires: ${token.expiresAt || 'Never'}`;
        break;
    }

    return formatToolResponse(
      "success",
      `API token details for ${args.tokenId}:`,
      {
        token: token,
        formattedOutput: formattedOutput,
        format: outputFormat
      }
    );

  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to get API token: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};