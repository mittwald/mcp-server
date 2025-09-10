import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { executeCli, parseJsonOutput } from '../../../../utils/cli-wrapper.js';

interface MittwaldUserGetArgs {
  userId?: string;
  output?: "txt" | "json" | "yaml";
}

export const handleUserGetCli: MittwaldCliToolHandler<MittwaldUserGetArgs> = async (args) => {
  try {
    // Build CLI command arguments
    const cliArgs: string[] = ['user', 'get'];
    
    // Add user ID (defaults to 'self' if not provided)
    const userId = args.userId || 'self';
    cliArgs.push(userId);
    
    // Always use JSON output for consistent parsing
    cliArgs.push('--output', 'json');
    
    // Execute CLI command
  const result = await executeCli('mw', cliArgs);
    
    if (result.exitCode !== 0) {
      const errorMessage = result.stderr || result.stdout || 'Unknown error';
      
      if (errorMessage.includes('not found') || errorMessage.includes('No user found')) {
        return formatToolResponse(
          "error",
          `User not found: ${userId}.\nError: ${errorMessage}`
        );
      }
      
      return formatToolResponse(
        "error",
        `Failed to get user: ${errorMessage}`
      );
    }
    
    // Parse JSON output
    try {
      const data = parseJsonOutput(result.stdout);
      
      if (!data || typeof data !== 'object') {
        return formatToolResponse(
          "error",
          "Unexpected output format from CLI command"
        );
      }
      
      const user = data;
      
      // Create formatted output for different formats (matching original behavior)
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
First Name: ${(user.person as any)?.firstName || 'N/A'}
Last Name: ${(user.person as any)?.lastName || 'N/A'}
Phone: ${user.phoneNumber || 'N/A'}
Registered: ${user.registeredAt || 'N/A'}
MFA Active: ${(user as any).mfa?.active ? 'Yes' : 'No'}`;
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
      
    } catch (parseError) {
      // If JSON parsing fails, return the raw output
      return formatToolResponse(
        "success",
        "User retrieved (raw output)",
        {
          rawOutput: result.stdout,
          parseError: parseError instanceof Error ? parseError.message : String(parseError)
        }
      );
    }
    
  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
