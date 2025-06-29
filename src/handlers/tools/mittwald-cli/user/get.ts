import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';

interface MittwaldUserGetArgs {
  userId?: string;
  output?: "txt" | "json" | "yaml";
}

export const handleUserGet: MittwaldToolHandler<MittwaldUserGetArgs> = async (args, { mittwaldClient }) => {
  try {
    const userId = args.userId || 'self';
    
    // Get user details from the API
    const result = await mittwaldClient.api.user.getUser({
      userId: userId
    });

    if (!result.data) {
      return formatToolResponse(
        "error",
        `User not found: ${userId}`
      );
    }

    const user = result.data;
    
    // Format output based on requested format
    let formattedOutput;
    const outputFormat = args.output || 'txt';
    
    switch (outputFormat) {
      case 'json':
        formattedOutput = JSON.stringify(user, null, 2);
        break;
      case 'yaml':
        // Simple YAML-like output
        formattedOutput = Object.entries(user)
          .map(([key, value]) => `${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`)
          .join('\n');
        break;
      case 'txt':
      default:
        // Human-readable text output
        formattedOutput = `User Profile:
ID: ${user.userId || 'N/A'}
Email: ${user.email || 'N/A'}
First Name: ${user.person?.firstName || 'N/A'}
Last Name: ${user.person?.lastName || 'N/A'}
Phone: ${user.phoneNumber || 'N/A'}
Registered: ${user.registeredAt || 'N/A'}
MFA Active: ${user.mfa?.active ? 'Yes' : 'No'}`;
        break;
    }

    return formatToolResponse(
      "success",
      `User details for ${userId}:`,
      {
        user: user,
        formattedOutput: formattedOutput,
        format: outputFormat
      }
    );

  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to get user: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};