import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { executeCli } from '../../../../utils/cli-wrapper.js';

interface MittwaldRegistryDeleteCliArgs {
  registryId: string;
  force?: boolean;
}

export const handleRegistryDeleteCli: MittwaldToolHandler<MittwaldRegistryDeleteCliArgs> = async (args) => {
  try {
    // Build CLI command arguments
    const cliArgs: string[] = ['registry', 'delete', args.registryId];
    
    // Optional flags
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
      
      if (errorMessage.includes('not found') && errorMessage.includes('registry')) {
        return formatToolResponse(
          "error",
          `Registry not found: ${args.registryId}\nError: ${errorMessage}`
        );
      }
      
      return formatToolResponse(
        "error",
        `Failed to delete registry: ${errorMessage}`
      );
    }
    
    // Handle output
    const successMessage = result.stdout || 'Registry deleted successfully';
    
    return formatToolResponse(
      "success",
      `Registry deletion completed`,
      {
        registryId: args.registryId,
        status: 'deleted',
        output: successMessage
      }
    );
    
  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};