import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { executeCli } from '../../../../utils/cli-wrapper.js';

interface MittwaldExtensionUninstallCliArgs {
  extensionInstanceId: string;
}

export const handleExtensionUninstallCli: MittwaldToolHandler<MittwaldExtensionUninstallCliArgs> = async (args) => {
  try {
    // Build CLI command arguments
    const cliArgs: string[] = ['extension', 'uninstall', args.extensionInstanceId];
    
    
    // Execute CLI command
  const result = await executeCli('mw', cliArgs);
    
    if (result.exitCode !== 0) {
      const errorMessage = result.stderr || result.stdout || 'Unknown error';
      
      if (errorMessage.includes('not found') && errorMessage.includes('extension')) {
        return formatToolResponse(
          "error",
          `Extension instance not found: ${args.extensionInstanceId}\nError: ${errorMessage}`
        );
      }
      
      return formatToolResponse(
        "error",
        `Failed to uninstall extension: ${errorMessage}`
      );
    }
    
    // Handle output
    const successMessage = result.stdout || 'Extension uninstallation completed successfully';
    
    return formatToolResponse(
      "success",
      `Extension uninstallation completed`,
      {
        extensionInstanceId: args.extensionInstanceId,
        status: 'uninstalled',
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
