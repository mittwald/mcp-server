import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { assertStatus } from '@mittwald/api-client';

export interface MittwaldAppUpdateArgs {
  installationId?: string;
  description?: string;
  documentRoot?: string;
  entrypoint?: string;
  quiet?: boolean;
}

export const handleAppUpdate: MittwaldToolHandler<MittwaldAppUpdateArgs> = async (args, { mittwaldClient, appContext }) => {
  try {
    // Get installation ID from args or context
    const installationId = args.installationId || (appContext as any)?.installationId;
    
    if (!installationId) {
      throw new Error("App installation ID is required. Either provide it as a parameter or set a default app installation in the context.");
    }

    // Check if any update properties are provided
    if (!args.description && !args.documentRoot && !args.entrypoint) {
      throw new Error("At least one property must be specified to update (description, documentRoot, or entrypoint).");
    }

    // Get current app installation details for validation and logging
    const appResponse = await mittwaldClient.api.app.getAppinstallation({
      appInstallationId: installationId
    });
    assertStatus(appResponse, 200);
    
    const appInstallation = appResponse.data;

    // Build update payload
    const updatePayload: any = {};
    
    if (args.description !== undefined) {
      updatePayload.description = args.description;
    }
    
    if (args.documentRoot !== undefined) {
      updatePayload.customDocumentRoot = args.documentRoot;
    }
    
    // Handle entrypoint updates for Python and Node.js apps
    if (args.entrypoint !== undefined) {
      // For simplicity, we'll add entrypoint to userInputs if it's a supported app type
      // In a real implementation, you'd need to check the app type and format accordingly
      updatePayload.userInputs = [
        {
          name: "entrypoint",
          value: args.entrypoint
        }
      ];
    }

    // Perform the update
    const updateResponse = await mittwaldClient.api.app.patchAppinstallation({
      appInstallationId: installationId,
      data: updatePayload
    });
    assertStatus(updateResponse, 204);

    // Format response based on quiet flag
    if (args.quiet) {
      return formatToolResponse(
        "success",
        "App installation updated",
        {
          appInstallationId: installationId,
          status: "updated"
        }
      );
    } else {
      const updatedProperties = [];
      if (args.description !== undefined) updatedProperties.push("description");
      if (args.documentRoot !== undefined) updatedProperties.push("document root");
      if (args.entrypoint !== undefined) updatedProperties.push("entrypoint");

      return formatToolResponse(
        "success",
        `App installation "${appInstallation.app.name}" updated successfully`,
        {
          appInstallationId: installationId,
          appName: appInstallation.app.name,
          projectId: appInstallation.projectId,
          updatedProperties: updatedProperties,
          updates: {
            ...(args.description !== undefined && { description: args.description }),
            ...(args.documentRoot !== undefined && { documentRoot: args.documentRoot }),
            ...(args.entrypoint !== undefined && { entrypoint: args.entrypoint })
          },
          message: `Successfully updated ${updatedProperties.join(", ")} for ${appInstallation.app.name}`
        }
      );
    }

  } catch (error) {
    return formatToolResponse(
      "error",
      error instanceof Error ? error.message : 'Unknown error occurred'
    );
  }
};