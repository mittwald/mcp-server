import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { executeCli, parseQuietOutput } from '../../../../utils/cli-wrapper.js';

interface MittwaldStackDeleteCliArgs {
  stackId?: string;
  quiet?: boolean;
  force?: boolean;
  withVolumes?: boolean;
}

export const handleStackDeleteCli: MittwaldToolHandler<MittwaldStackDeleteCliArgs> = async (args) => {
  try {
    // Build CLI command arguments
    const cliArgs: string[] = ['stack', 'delete'];
    
    // Optional stack ID argument
    if (args.stackId) {
      cliArgs.push(args.stackId);
    }
    
    // Optional flags
    if (args.quiet) {
      cliArgs.push('--quiet');
    }
    
    if (args.force) {
      cliArgs.push('--force');
    }
    
    if (args.withVolumes) {
      cliArgs.push('--with-volumes');
    }
    
    // Execute CLI command
    const result = await executeCli('mw', cliArgs, {
      env: {
        MITTWALD_API_TOKEN: process.env.MITTWALD_API_TOKEN || ''
      }
    });
    
    if (result.exitCode !== 0) {
      const errorMessage = result.stderr || result.stdout || 'Unknown error';
      
      if (errorMessage.includes('not found') && errorMessage.includes('stack')) {
        return formatToolResponse(
          "error",
          `Stack not found: ${args.stackId || 'not specified'}.\nError: ${errorMessage}`
        );
      }
      
      return formatToolResponse(
        "error",
        `Failed to delete stack: ${errorMessage}`
      );
    }
    
    // Handle quiet output
    if (args.quiet) {
      const result_id = parseQuietOutput(result.stdout);
      return formatToolResponse(
        "success",
        `Stack deleted successfully`,
        {
          stackId: args.stackId,
          status: 'deleted',
          resultId: result_id,
          withVolumes: args.withVolumes
        }
      );
    }
    
    // Handle regular output
    const successMessage = result.stdout || 'Stack deleted successfully';
    
    return formatToolResponse(
      "success",
      `Stack deletion completed`,
      {
        stackId: args.stackId,
        status: 'deleted',
        withVolumes: args.withVolumes,
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