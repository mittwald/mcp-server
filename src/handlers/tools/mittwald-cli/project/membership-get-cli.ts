import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { executeCli, parseJsonOutput } from '../../../../utils/cli-wrapper.js';

export interface MittwaldProjectMembershipGetArgs {
  membershipId: string;
  output?: 'txt' | 'json' | 'yaml';
}

export const handleProjectMembershipGetCli: MittwaldToolHandler<MittwaldProjectMembershipGetArgs> = async (args, context) => {
  try {
    // Build CLI command arguments
    const cliArgs: string[] = ['project', 'membership', 'get', args.membershipId];
    
    // Always use JSON output for consistent parsing
    cliArgs.push('--output', 'json');
    
    // Execute CLI command
    const result = await executeCli('mw', cliArgs, {
      env: {
        MITTWALD_API_TOKEN: process.env.MITTWALD_API_TOKEN || ''
      }
    });
    
    if (result.exitCode !== 0) {
      const errorMessage = result.stderr || result.stdout || 'Unknown error';
      
      if (errorMessage.includes('not found') || errorMessage.includes('404')) {
        return formatToolResponse(
          "error",
          `Project membership not found. Please verify the membership ID: ${args.membershipId}.\nError: ${errorMessage}`
        );
      }
      
      if (errorMessage.includes('not authenticated') || errorMessage.includes('401')) {
        return formatToolResponse(
          "error",
          `Authentication failed. Please ensure your API token is valid.\nError: ${errorMessage}`
        );
      }
      
      if (errorMessage.includes('forbidden') || errorMessage.includes('403')) {
        return formatToolResponse(
          "error",
          `Access denied. You don't have permission to view this project membership.\nError: ${errorMessage}`
        );
      }
      
      return formatToolResponse(
        "error",
        `Failed to get project membership: ${errorMessage}`
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
        userId: data.userId,
        email: data.email || data.user?.email,
        name: data.name || data.user?.name || data.user?.person?.name,
        role: data.role || data.projectRole,
        status: data.status || 'active',
        createdAt: data.createdAt,
        expiresAt: data.expiresAt || data.membershipExpiresAt || 'Never',
        projectId: data.projectId,
        permissions: data.permissions || data.projectPermissions
      };
      
      return formatToolResponse(
        "success",
        `Project membership retrieved successfully`,
        formattedData
      );
      
    } catch (parseError) {
      // If JSON parsing fails, return the raw output
      return formatToolResponse(
        "success",
        "Project membership retrieved (raw output)",
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