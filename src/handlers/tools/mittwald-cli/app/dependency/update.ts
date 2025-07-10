import type { MittwaldToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { executeCli, parseQuietOutput } from '../../../../../utils/cli-wrapper.js';

interface AppDependencyUpdateArgs {
  installationId?: string;
  set: string[];
  updatePolicy?: 'none' | 'inheritedFromApp' | 'patchLevel' | 'all';
  quiet?: boolean;
}

export const handleMittwaldAppDependencyUpdate: MittwaldToolHandler<AppDependencyUpdateArgs> = async (args, context) => {
  try {
    if (!args.set || args.set.length === 0) {
      return formatToolResponse(
        "error",
        "At least one dependency must be specified with --set"
      );
    }
    
    // Build CLI command arguments
    const cliArgs: string[] = ['app', 'dependency', 'update'];
    
    // Add installation ID if provided
    if (args.installationId) {
      cliArgs.push(args.installationId);
    }
    
    // Add set parameters
    for (const dep of args.set) {
      cliArgs.push('--set', dep);
    }
    
    // Add update policy
    if (args.updatePolicy) {
      cliArgs.push('--update-policy', args.updatePolicy);
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
      
      // Handle specific error cases
      if (errorMessage.includes('not found') && errorMessage.includes('app')) {
        return formatToolResponse(
          "error",
          `App installation not found. Please verify the installation ID: ${args.installationId || 'not specified'}.\nError: ${errorMessage}`
        );
      }
      
      if (errorMessage.includes('Unknown system software')) {
        return formatToolResponse(
          "error",
          `Unknown system software specified. Use 'mittwald_app_dependency_list' to see available dependencies.\nError: ${errorMessage}`
        );
      }
      
      return formatToolResponse(
        "error",
        `Failed to update app dependencies: ${errorMessage}`
      );
    }
    
    // Handle quiet mode response
    if (args.quiet) {
      const outputId = parseQuietOutput(result.stdout);
      return formatToolResponse(
        "success",
        outputId || "Dependencies updated successfully",
        { installationId: outputId || args.installationId }
      );
    }
    
    // Handle regular response
    return formatToolResponse(
      "success",
      "Dependencies updated successfully",
      {
        installationId: args.installationId,
        updatedDependencies: args.set,
        updatePolicy: args.updatePolicy || 'patchLevel',
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