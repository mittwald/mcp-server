import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { assertStatus } from '@mittwald/api-client';

export interface MittwaldAppUninstallArgs {
  installationId?: string;
  force?: boolean;
  quiet?: boolean;
}

export const handleAppUninstall: MittwaldToolHandler<MittwaldAppUninstallArgs> = async (args, { mittwaldClient, appContext }) => {
  try {
    // Get installation ID from args or context
    const installationId = args.installationId || (appContext as any)?.installationId;
    
    if (!installationId) {
      throw new Error("App installation ID is required. Either provide it as a parameter or set a default app installation in the context.");
    }

    // Get app installation details for confirmation and logging
    const appResponse = await mittwaldClient.app.api.getAppinstallation({
      appInstallationId: installationId
    });
    assertStatus(appResponse, 200);
    
    const appInstallation = appResponse.data;

    // In MCP context, force confirmation is required since we can't interactively prompt
    if (!args.force) {
      return formatToolResponse(
        "error",
        "Confirmation required: Use the 'force' parameter to confirm app uninstallation. This action cannot be undone."
      );
    }

    // Perform the uninstallation
    const uninstallResponse = await mittwaldClient.app.api.deleteAppinstallation({
      appInstallationId: installationId
    });
    assertStatus(uninstallResponse, 204);

    // Format response based on quiet flag
    if (args.quiet) {
      return formatToolResponse(
        "success",
        "App uninstallation initiated",
        {
          appInstallationId: installationId,
          status: "uninstalling"
        }
      );
    } else {
      return formatToolResponse(
        "success",
        `App uninstallation initiated for ${appInstallation.app.name}`,
        {
          appInstallationId: installationId,
          appName: appInstallation.app.name,
          projectId: appInstallation.projectId,
          status: "uninstalling",
          message: `Uninstallation process has been started for ${appInstallation.app.name}. The app will be removed from your project.`
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