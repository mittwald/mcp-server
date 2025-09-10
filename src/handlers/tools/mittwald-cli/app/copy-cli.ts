import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { executeCli, parseQuietOutput } from '../../../../utils/cli-wrapper.js';

interface MittwaldAppCopyArgs {
  installationId?: string;
  description: string;
  quiet?: boolean;
}

export const handleAppCopyCli: MittwaldCliToolHandler<MittwaldAppCopyArgs> = async (args) => {
  try {
    if (!args.installationId) {
      return formatToolResponse(
        "error",
        "Installation ID is required. Please provide the installationId parameter."
      );
    }

    if (!args.description) {
      return formatToolResponse(
        "error",
        "Description is required. Please provide the description parameter."
      );
    }

    // Build CLI command arguments
    const cliArgs: string[] = ['app', 'copy'];
    
    // Add installation ID as positional argument
    cliArgs.push(args.installationId);
    
    // Add description flag
    cliArgs.push('--description', args.description);
    
    // Add quiet flag if requested
    if (args.quiet) {
      cliArgs.push('--quiet');
    }
    
    // Execute CLI command
    const result = await executeCli('mw', cliArgs, {
      env: {
        MITTWALD_NONINTERACTIVE: '1'
      }
    });
    
    if (result.exitCode !== 0) {
      const errorMessage = result.stderr || result.stdout || 'Unknown error';
      
      if (errorMessage.includes('not found') && errorMessage.includes('installation')) {
        return formatToolResponse(
          "error",
          `App installation not found. Please verify the installation ID: ${args.installationId}.\nError: ${errorMessage}`
        );
      }
      
      return formatToolResponse(
        "error",
        `Failed to copy app: ${errorMessage}`
      );
    }
    
    // Handle quiet output
    if (args.quiet) {
      try {
        const newInstallationId = parseQuietOutput(result.stdout);
        if (newInstallationId) {
          return formatToolResponse(
            "success",
            `App copied successfully`,
            {
              originalInstallationId: args.installationId,
              newInstallationId: newInstallationId,
              description: args.description
            }
          );
        }
      } catch (parseError) {
        // Continue to regular output handling
      }
    }
    
    // Regular output handling
    const output = result.stdout || result.stderr || 'App copied successfully';
    
    return formatToolResponse(
      "success",
      `App copied successfully`,
      {
        originalInstallationId: args.installationId,
        description: args.description,
        output: output
      }
    );
    
  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
