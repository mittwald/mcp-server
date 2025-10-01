import type { MittwaldCliToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { executeCli } from '../../../../../utils/cli-wrapper.js';

interface MittwaldMailAddressDeleteArgs {
  id: string;
  quiet?: boolean;
  force?: boolean;
}

export const handleMittwaldMailAddressDeleteCli: MittwaldCliToolHandler<MittwaldMailAddressDeleteArgs> = async (args) => {
  try {
    // Build CLI command arguments
    const cliArgs: string[] = ['mail', 'address', 'delete'];
    
    // Required ID
    cliArgs.push(args.id);
    
    // Optional flags
    if (args.quiet) {
      cliArgs.push('--quiet');
    }
    
    if (args.force) {
      cliArgs.push('--force');
    }
    
    // Execute CLI command
    const result = await executeCli('mw', cliArgs);
    
    if (result.exitCode !== 0) {
      // Parse error message from stderr or stdout
      const errorMessage = result.stderr || result.stdout || 'Unknown error';
      
      // Check for common error patterns
      if (errorMessage.includes('403') || errorMessage.includes('Forbidden') || errorMessage.includes('Permission denied')) {
        return formatToolResponse(
          "error",
          `Permission denied when deleting mail address. Check if your API token has mail management permissions.\nError: ${errorMessage}`
        );
      }
      
      if (errorMessage.includes('not found') || errorMessage.includes('404')) {
        return formatToolResponse(
          "error",
          `Mail address not found: ${args.id}.\nError: ${errorMessage}`
        );
      }
      
      if (errorMessage.includes('cancelled') || errorMessage.includes('aborted')) {
        return formatToolResponse(
          "error",
          `Delete operation cancelled. Use --force to delete without confirmation.\nError: ${errorMessage}`
        );
      }
      
      return formatToolResponse(
        "error",
        `Failed to delete mail address: ${errorMessage}`
      );
    }
    
    // Success response
    return formatToolResponse(
      "success",
      args.quiet ? 
        result.stdout || 'Mail address deleted' :
        `Successfully deleted mail address: ${args.id}`,
      {
        id: args.id,
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
