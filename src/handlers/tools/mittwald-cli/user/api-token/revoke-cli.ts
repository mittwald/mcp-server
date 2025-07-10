import type { MittwaldToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { executeCli, parseQuietOutput } from '../../../../../utils/cli-wrapper.js';

interface MittwaldUserApiTokenRevokeArgs {
  tokenId: string;
  force?: boolean;
  quiet?: boolean;
}

export const handleUserApiTokenRevokeCli: MittwaldToolHandler<MittwaldUserApiTokenRevokeArgs> = async (args) => {
  try {
    // Build CLI command arguments
    const cliArgs: string[] = ['user', 'api-token', 'revoke'];
    
    // Add token ID
    cliArgs.push(args.tokenId);
    
    // Optional flags
    if (args.force) {
      cliArgs.push('--force');
    }
    
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
      
      if (errorMessage.includes('not found') || errorMessage.includes('No token found')) {
        return formatToolResponse(
          "error",
          `API token not found: ${args.tokenId}.\nError: ${errorMessage}`
        );
      }
      
      return formatToolResponse(
        "error",
        `Failed to revoke API token: ${errorMessage}`
      );
    }
    
    // Handle quiet mode output
    if (args.quiet) {
      const output = parseQuietOutput(result.stdout);
      
      return formatToolResponse(
        "success",
        output || "API token revoked successfully",
        { 
          tokenId: args.tokenId,
          revoked: true
        }
      );
    }
    
    // For non-quiet mode, return success with the output
    const output = result.stdout.trim();
    
    return formatToolResponse(
      "success",
      output || `API token ${args.tokenId} revoked successfully`,
      {
        tokenId: args.tokenId,
        revoked: true,
        rawOutput: output
      }
    );
    
  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};