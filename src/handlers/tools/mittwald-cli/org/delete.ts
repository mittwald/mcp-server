import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { executeCli, parseQuietOutput } from '../../../../utils/cli-wrapper.js';

export interface MittwaldOrgDeleteArgs {
  orgId?: string;
  force?: boolean;
  quiet?: boolean;
}

export const handleOrgDeleteCli: MittwaldToolHandler<MittwaldOrgDeleteArgs> = async (args, { orgContext }) => {
  try {
    // Get org ID from args or context
    const orgId = args.orgId || (orgContext as any)?.orgId;
    
    if (!orgId) {
      return formatToolResponse(
        "error",
        "Organization ID is required. Either provide it as a parameter or set a default org in the context."
      );
    }

    // Build CLI command arguments
    const cliArgs: string[] = ['org', 'delete', orgId];
    
    // Add force flag (required for non-interactive mode)
    if (args.force) {
      cliArgs.push('--force');
    }
    
    // Add quiet flag
    if (args.quiet) {
      cliArgs.push('--quiet');
    }
    
    // Execute CLI command
    const result = await executeCli('mw', cliArgs, {
      env: {
        MITTWALD_API_TOKEN: process.env.MITTWALD_API_TOKEN || ''
      }
    });
    
    if (result.exitCode !== 0) {
      const errorMessage = result.stderr || result.stdout || 'Unknown error';
      
      if (errorMessage.includes('confirmation required')) {
        return formatToolResponse(
          "error",
          `Force flag (--force) is required for organization deletion. Error: ${errorMessage}`
        );
      }
      
      if (errorMessage.includes('not found')) {
        return formatToolResponse(
          "error",
          `Organization not found: ${orgId}.\nError: ${errorMessage}`
        );
      }
      
      return formatToolResponse(
        "error",
        `Failed to delete organization: ${errorMessage}`
      );
    }
    
    // Handle quiet output
    if (args.quiet) {
      const quietResult = parseQuietOutput(result.stdout);
      return formatToolResponse(
        "success",
        `Organization ${orgId} deleted successfully`,
        { orgId, deleted: true, result: quietResult }
      );
    }
    
    // Regular output
    return formatToolResponse(
      "success",
      `Organization ${orgId} has been deleted successfully`,
      {
        orgId,
        deleted: true,
        output: result.stdout
      }
    );
    
  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};

// Export with old name for backward compatibility
export const handleOrgDelete = handleOrgDeleteCli;