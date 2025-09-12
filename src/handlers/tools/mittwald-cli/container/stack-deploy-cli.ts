import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { executeCli } from '../../../../utils/cli-wrapper.js';

interface MittwaldStackDeployCliArgs {
  stackId?: string;
  composeFile?: string;
  envFile?: string;
}

export const handleStackDeployCli: MittwaldToolHandler<MittwaldStackDeployCliArgs> = async (args) => {
  try {
    // Build CLI command arguments
    const cliArgs: string[] = ['stack', 'deploy'];
    
    // Optional flags
    if (args.stackId) {
      cliArgs.push('--stack-id', args.stackId);
    }
    
    
    if (args.composeFile) {
      cliArgs.push('--compose-file', args.composeFile);
    }
    
    if (args.envFile) {
      cliArgs.push('--env-file', args.envFile);
    }
    
    // Execute CLI command
    const result = await executeCli('mw', cliArgs);
    
    if (result.exitCode !== 0) {
      const errorMessage = result.stderr || result.stdout || 'Unknown error';
      
      if (errorMessage.includes('not found') && errorMessage.includes('stack')) {
        return formatToolResponse(
          "error",
          `Stack not found: ${args.stackId || 'not specified'}.\nError: ${errorMessage}`
        );
      }
      
      if (errorMessage.includes('not found') && errorMessage.includes('file')) {
        return formatToolResponse(
          "error",
          `Compose file not found: ${args.composeFile || 'docker-compose.yml'}.\nError: ${errorMessage}`
        );
      }
      
      return formatToolResponse(
        "error",
        `Failed to deploy stack: ${errorMessage}`
      );
    }
    
    // Handle regular output
    const successMessage = result.stdout || 'Stack deployed successfully';
    
    return formatToolResponse(
      "success",
      `Stack deployment completed`,
      {
        stackId: args.stackId,
        status: 'deployed',
        composeFile: args.composeFile,
        envFile: args.envFile,
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
