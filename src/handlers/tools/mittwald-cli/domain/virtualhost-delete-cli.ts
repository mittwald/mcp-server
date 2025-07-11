import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { executeCli } from '../../../../utils/cli-wrapper.js';

interface MittwaldDomainVirtualhostDeleteArgs {
  virtualhostId: string;
  force?: boolean;
}

export const handleDomainVirtualhostDeleteCli: MittwaldToolHandler<MittwaldDomainVirtualhostDeleteArgs> = async (args) => {
  try {
    // Build CLI command arguments
    const cliArgs: string[] = ['domain', 'virtualhost', 'delete', args.virtualhostId];
    
    // Add force flag if specified
    if (args.force) {
      cliArgs.push('--force');
    }
    
    // Execute CLI command
    const result = await executeCli('mw', cliArgs, {
      env: {
        MITTWALD_API_TOKEN: process.env.MITTWALD_API_TOKEN || ''
      }
    });
    
    if (result.exitCode !== 0) {
      const errorMessage = result.stderr || result.stdout || 'Unknown error';
      
      if (errorMessage.includes('not found')) {
        return formatToolResponse(
          "error",
          `Virtual host not found: ${args.virtualhostId}.\nError: ${errorMessage}`
        );
      }
      
      if (errorMessage.includes('403') || errorMessage.includes('Forbidden') || errorMessage.includes('Permission denied')) {
        return formatToolResponse(
          "error",
          `Permission denied when deleting virtual host. Check if your API token has domain management permissions.\nError: ${errorMessage}`
        );
      }
      
      return formatToolResponse(
        "error",
        `Failed to delete virtual host: ${errorMessage}`
      );
    }
    
    // Success message
    return formatToolResponse(
      "success",
      `Successfully deleted virtual host ${args.virtualhostId}`,
      {
        deletedId: args.virtualhostId
      }
    );
    
  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};