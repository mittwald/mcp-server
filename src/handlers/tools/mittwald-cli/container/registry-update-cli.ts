import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { executeCli, parseQuietOutput } from '../../../../utils/cli-wrapper.js';

interface MittwaldRegistryUpdateCliArgs {
  registryId: string;
  quiet?: boolean;
  description?: string;
  uri?: string;
  username?: string;
  password?: string;
}

export const handleRegistryUpdateCli: MittwaldToolHandler<MittwaldRegistryUpdateCliArgs> = async (args) => {
  try {
    // Build CLI command arguments
    const cliArgs: string[] = ['registry', 'update', args.registryId];
    
    // Optional flags
    if (args.quiet) {
      cliArgs.push('--quiet');
    }
    
    if (args.description) {
      cliArgs.push('--description', args.description);
    }
    
    if (args.uri) {
      cliArgs.push('--uri', args.uri);
    }
    
    if (args.username) {
      cliArgs.push('--username', args.username);
    }
    
    if (args.password) {
      cliArgs.push('--password', args.password);
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
        `Failed to update registry: ${errorMessage}`
      );
    }
    
    // Handle quiet output
    if (args.quiet) {
      const result_id = parseQuietOutput(result.stdout);
      return formatToolResponse(
        "success",
        `Registry updated successfully`,
        {
          registryId: args.registryId,
          status: 'updated',
          resultId: result_id,
          updates: {
            description: args.description,
            uri: args.uri,
            username: args.username
          }
        }
      );
    }
    
    // Handle regular output
    const successMessage = result.stdout || 'Registry updated successfully';
    
    return formatToolResponse(
      "success",
      `Registry update completed`,
      {
        registryId: args.registryId,
        status: 'updated',
        updates: {
          description: args.description,
          uri: args.uri,
          username: args.username
        },
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