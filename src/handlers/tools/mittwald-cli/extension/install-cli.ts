import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { executeCli, parseQuietOutput } from '../../../../utils/cli-wrapper.js';

interface MittwaldExtensionInstallCliArgs {
  extensionId: string;
  projectId?: string;
  orgId?: string;
  quiet?: boolean;
  consent?: boolean;
}

export const handleExtensionInstallCli: MittwaldToolHandler<MittwaldExtensionInstallCliArgs> = async (args) => {
  try {
    // Validate that exactly one of projectId or orgId is provided
    if (!args.projectId && !args.orgId) {
      return formatToolResponse(
        "error",
        "Either projectId or orgId must be provided"
      );
    }

    if (args.projectId && args.orgId) {
      return formatToolResponse(
        "error",
        "Only one of projectId or orgId can be provided"
      );
    }

    // Build CLI command arguments
    const cliArgs: string[] = ['extension', 'install', args.extensionId];
    
    // Context flags
    if (args.projectId) {
      cliArgs.push('--project-id', args.projectId);
    }
    
    if (args.orgId) {
      cliArgs.push('--org-id', args.orgId);
    }
    
    // Optional flags
    if (args.quiet) {
      cliArgs.push('--quiet');
    }
    
    if (args.consent) {
      cliArgs.push('--consent');
    }
    
    // Execute CLI command
    const result = await executeCli('mw', cliArgs, {
      env: {
        MITTWALD_API_TOKEN: process.env.MITTWALD_API_TOKEN || ''
      }
    });
    
    if (result.exitCode !== 0) {
      const errorMessage = result.stderr || result.stdout || 'Unknown error';
      
      if (errorMessage.includes('not found') && errorMessage.includes('extension')) {
        return formatToolResponse(
          "error",
          `Extension not found: ${args.extensionId}\nError: ${errorMessage}`
        );
      }
      
      if (errorMessage.includes('not found') && (errorMessage.includes('project') || errorMessage.includes('organization'))) {
        return formatToolResponse(
          "error",
          `Resource not found. Please verify the ${args.projectId ? 'project' : 'organization'} ID: ${args.projectId || args.orgId}.\nError: ${errorMessage}`
        );
      }
      
      if (errorMessage.includes('consent') || errorMessage.includes('scope')) {
        return formatToolResponse(
          "error",
          `Consent required. Please run the command with consent=true to grant permissions.\nError: ${errorMessage}`
        );
      }
      
      return formatToolResponse(
        "error",
        `Failed to install extension: ${errorMessage}`
      );
    }
    
    // Handle quiet output
    if (args.quiet) {
      const extensionInstanceId = parseQuietOutput(result.stdout);
      return formatToolResponse(
        "success",
        `Extension installed successfully`,
        {
          extensionInstanceId,
          extensionId: args.extensionId,
          projectId: args.projectId,
          orgId: args.orgId,
          status: 'installed'
        }
      );
    }
    
    // Handle regular output
    const successMessage = result.stdout || 'Extension installation completed successfully';
    
    return formatToolResponse(
      "success",
      `Extension installation completed`,
      {
        extensionId: args.extensionId,
        projectId: args.projectId,
        orgId: args.orgId,
        status: 'installed',
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