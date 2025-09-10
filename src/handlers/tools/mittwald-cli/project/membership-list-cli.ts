import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { executeCli, parseJsonOutput } from '../../../../utils/cli-wrapper.js';

export interface MittwaldProjectMembershipListArgs {
  projectId: string;
  output?: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
  extended?: boolean;
  noHeader?: boolean;
  noTruncate?: boolean;
  noRelativeDates?: boolean;
  csvSeparator?: ',' | ';';
}

export const handleProjectMembershipListCli: MittwaldToolHandler<MittwaldProjectMembershipListArgs> = async (args, context) => {
  try {
    // Build CLI command arguments
    const cliArgs: string[] = ['project', 'membership', 'list'];
    
    // Always use JSON output for consistent parsing
    cliArgs.push('--output', 'json');
    
    // Required project ID
    cliArgs.push('--project-id', args.projectId);
    
    // Optional flags
    if (args.extended) {
      cliArgs.push('--extended');
    }
    
    if (args.noHeader) {
      cliArgs.push('--no-header');
    }
    
    if (args.noTruncate) {
      cliArgs.push('--no-truncate');
    }
    
    if (args.noRelativeDates) {
      cliArgs.push('--no-relative-dates');
    }
    
    if (args.csvSeparator) {
      cliArgs.push('--csv-separator', args.csvSeparator);
    }
    
    // Execute CLI command
  const result = await executeCli('mw', cliArgs);
    
    if (result.exitCode !== 0) {
      const errorMessage = result.stderr || result.stdout || 'Unknown error';
      
      if (errorMessage.includes('not found') && errorMessage.includes('project')) {
        return formatToolResponse(
          "error",
          `Project not found. Please verify the project ID: ${args.projectId}.\nError: ${errorMessage}`
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
          `Access denied. You don't have permission to view project memberships.\nError: ${errorMessage}`
        );
      }
      
      return formatToolResponse(
        "error",
        `Failed to list project memberships: ${errorMessage}`
      );
    }
    
    // Parse JSON output
    try {
      const data = parseJsonOutput(result.stdout);
      
      if (!Array.isArray(data)) {
        return formatToolResponse(
          "error",
          "Unexpected output format from CLI command"
        );
      }
      
      if (data.length === 0) {
        return formatToolResponse(
          "success",
          "No project memberships found",
          []
        );
      }
      
      // Format the data to match our expected structure
      const formattedData = data.map(item => ({
        id: item.id,
        userId: item.userId,
        email: item.email || item.user?.email,
        name: item.name || item.user?.name || item.user?.person?.name,
        role: item.role || item.projectRole,
        status: item.status || 'active',
        createdAt: item.createdAt,
        expiresAt: item.expiresAt || item.membershipExpiresAt || 'Never',
        projectId: item.projectId
      }));
      
      return formatToolResponse(
        "success",
        `Found ${data.length} project membership(s)`,
        formattedData
      );
      
    } catch (parseError) {
      // If JSON parsing fails, return the raw output
      return formatToolResponse(
        "success",
        "Project memberships retrieved (raw output)",
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
