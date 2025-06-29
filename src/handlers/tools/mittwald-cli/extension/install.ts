import type { MittwaldToolHandler, MittwaldToolHandlerContext } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';

interface MittwaldExtensionInstallArgs {
  projectId: string;
  extensionId: string;
  description?: string;
  consent?: boolean;
  wait?: boolean;
  waitTimeout?: number;
}

export const handleExtensionInstall: MittwaldToolHandler<MittwaldExtensionInstallArgs> = async (args, { mittwaldClient }) => {
  
  try {
    // Load extension details
    const extensionResponse = await mittwaldClient.marketplace.extensionGetExtension({
      extensionId: args.extensionId,
    });

    if (extensionResponse.status !== 200 || !extensionResponse.data) {
      return formatToolResponse(
        "error",
        `Failed to load extension: Extension ${args.extensionId} not found`
      );
    }

    const extension = extensionResponse.data;

    // Handle consent flow
    if (extension.scopes && extension.scopes.length > 0 && !args.consent) {
      return formatToolResponse(
        "error",
        `Consent required for scopes: ${extension.scopes.join(', ')}. Please run the command with consent=true to grant permissions.`
      );
    }

    // Install the extension
    const installResponse = await mittwaldClient.marketplace.extensionCreateExtensionInstance({
      data: {
        extensionId: args.extensionId,
        context: 'project',
        contextId: args.projectId,
        consentedScopes: extension.scopes || [],
      },
    });

    if (installResponse.status !== 201 || !installResponse.data) {
      return formatToolResponse(
        "error",
        "Failed to install extension: Installation request failed"
      );
    }

    const extensionInstanceId = installResponse.data.id;

    // Wait for installation to complete if requested
    if (args.wait) {
      const timeout = args.waitTimeout || 300000; // 5 minutes default
      const startTime = Date.now();
      
      while (Date.now() - startTime < timeout) {
        try {
          const instanceResponse = await mittwaldClient.marketplace.extensionGetExtensionInstance({
            extensionInstanceId: extensionInstanceId,
          });

          if (instanceResponse.status === 200 && instanceResponse.data) {
            // Check if installation is complete (not pending)
            const instance = instanceResponse.data as any;
            if (!instance.pendingInstallation) {
              return formatToolResponse(
                "success",
                `Extension installed successfully`,
                {
                  extensionInstanceId,
                  extensionId: args.extensionId,
                  projectId: args.projectId,
                  name: extension.name,
                  status: 'installed'
                }
              );
            }
          }

          // Wait 2 seconds before checking again
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
          // Continue waiting even if there's an error checking status
        }
      }

      return formatToolResponse(
        "success",
        `Extension installation initiated but timed out waiting for completion`,
        {
          extensionInstanceId,
          extensionId: args.extensionId,
          projectId: args.projectId,
          name: extension.name,
          status: 'installing'
        }
      );
    }

    return formatToolResponse(
      "success",
      `Extension installation initiated successfully`,
      {
        extensionInstanceId,
        extensionId: args.extensionId,
        projectId: args.projectId,
        name: extension.name,
        status: 'installing'
      }
    );

  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to install extension: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};