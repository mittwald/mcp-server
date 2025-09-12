import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { executeCli, parseJsonOutput } from '../../../../utils/cli-wrapper.js';

export interface MittwaldProjectInviteGetArgs {
  inviteId: string;
  output?: 'json' | 'table' | 'yaml';
}

export const handleProjectInviteGetCli: MittwaldToolHandler<MittwaldProjectInviteGetArgs> = async (args, context) => {
  try {
    // Build CLI command arguments
    const cliArgs: string[] = ['project', 'invite', 'get', args.inviteId];
    
    // Always use JSON output for consistent parsing
    cliArgs.push('--output', 'json');
    
    // Execute CLI command
  const result = await executeCli('mw', cliArgs);
    
    if (result.exitCode !== 0) {
      const errorMessage = result.stderr || result.stdout || 'Unknown error';
      
      if (errorMessage.includes('not found') || errorMessage.includes('404')) {
        return formatToolResponse(
          "error",
          `Project invite not found. Please verify the invite ID: ${args.inviteId}.\nError: ${errorMessage}`
        );
      }
      
      if (errorMessage.includes('not authenticated') || errorMessage.includes('401')) {
        return formatToolResponse(
          "error",
          `Authentication failed. Complete OAuth sign-in and ensure the Mittwald CLI is authenticated.\nError: ${errorMessage}`
        );
      }
      
      if (errorMessage.includes('forbidden') || errorMessage.includes('403')) {
        return formatToolResponse(
          "error",
          `Access denied. You don't have permission to view this project invite.\nError: ${errorMessage}`
        );
      }
      
      return formatToolResponse(
        "error",
        `Failed to get project invite: ${errorMessage}`
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
      
      // Format the data to match our expected structure
      const formattedData = {
        id: data.id,
        email: data.mailAddress || data.email,
        role: data.projectRole || data.role,
        status: data.expired ? 'expired' : 'active',
        createdAt: data.createdAt,
        expiresAt: data.membershipExpiresAt || data.expiresAt || 'Never',
        projectId: data.projectId,
        userId: data.userId,
        invitedBy: data.invitedBy || data.inviter,
        message: data.message
      };
      
      return formatToolResponse(
        "success",
        `Project invite retrieved successfully`,
        formattedData
      );
      
    } catch (parseError) {
      // If JSON parsing fails, return the raw output
      return formatToolResponse(
        "success",
        "Project invite retrieved (raw output)",
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
