import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';

interface MittwaldExtensionUninstallArgs {
  extensionInstanceId: string;
}

export const handleExtensionUninstall: MittwaldToolHandler<MittwaldExtensionUninstallArgs> = async (args, { mittwaldClient }) => {
  try {
    // Delete the extension instance
    const response = await mittwaldClient.marketplace.extensionDeleteExtensionInstance({
      extensionInstanceId: args.extensionInstanceId,
    });

    // Check if the deletion was successful (204 No Content is expected)
    return formatToolResponse(
      "success",
      "Extension successfully uninstalled",
      {
        extensionInstanceId: args.extensionInstanceId,
        status: 'uninstalled'
      }
    );

  } catch (error) {
    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message.includes('404') || error.message.includes('not found')) {
        return formatToolResponse(
          "error",
          `Extension instance ${args.extensionInstanceId} not found`
        );
      }
      
      if (error.message.includes('403') || error.message.includes('forbidden')) {
        return formatToolResponse(
          "error",
          `Permission denied: You don't have access to uninstall extension instance ${args.extensionInstanceId}`
        );
      }
    }

    return formatToolResponse(
      "error",
      `Failed to uninstall extension: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};