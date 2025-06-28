import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';

interface MittwaldProjectInviteGetArgs {
  inviteId: string;
  output?: 'json' | 'table' | 'yaml';
}

export const handleProjectInviteGet: MittwaldToolHandler<MittwaldProjectInviteGetArgs> = async (args, { mittwaldClient }) => {
  try {
    // Get project invite details from the API
    const result = await mittwaldClient.api.project.getProjectInvite({
      projectInviteId: args.inviteId,
    });

    if (!result.data) {
      return formatToolResponse(
        "error",
        `Project invite not found: ${args.inviteId}`
      );
    }

    const invite = result.data;
    
    // Format output based on requested format
    let formattedOutput;
    const outputFormat = args.output || 'json';
    
    switch (outputFormat) {
      case 'json':
        formattedOutput = JSON.stringify(invite, null, 2);
        break;
      case 'yaml':
        // Simple YAML-like output
        formattedOutput = Object.entries(invite)
          .map(([key, value]) => `${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`)
          .join('\n');
        break;
      case 'table':
        // Table-like output
        formattedOutput = Object.entries(invite)
          .map(([key, value]) => `${key.padEnd(20)} ${typeof value === 'object' ? JSON.stringify(value) : value}`)
          .join('\n');
        break;
      default:
        formattedOutput = JSON.stringify(invite, null, 2);
    }

    return formatToolResponse(
      "success",
      `Project invite details for ${args.inviteId}:`,
      {
        invite: invite,
        formattedOutput: formattedOutput,
        format: outputFormat
      }
    );

  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to get project invite: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};