import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';

export interface MittwaldAppCreateStaticArgs {
  projectId?: string;
  documentRoot: string;
  siteTitle?: string;
  quiet?: boolean;
  wait?: boolean;
  waitTimeout?: number;
}

export const handleAppCreateStatic: MittwaldToolHandler<MittwaldAppCreateStaticArgs> = async (args, { mittwaldClient }) => {
  try {
    const projectId = args.projectId;
    
    if (!projectId) {
      throw new Error("Project ID is required");
    }

    // Static site app ID from CLI source
    const staticAppId = "d20baefd-81d2-42aa-bfba-9a3220ae839b";
    
    // Get latest Static site app version
    const versionsResponse = await mittwaldClient.app.api.listAppversions({ 
      appId: staticAppId 
    });
    
    if (versionsResponse.status !== 200) {
      throw new Error(`Failed to fetch Static site app versions: ${versionsResponse.status}`);
    }
    
    // Find the recommended version or latest version
    const versions = versionsResponse.data;
    const recommendedVersion = versions.find(v => v.recommended);
    const appVersionId = recommendedVersion?.id || versions[0]?.id;
    
    if (!appVersionId) {
      throw new Error("No Static site app versions available");
    }

    // Prepare user inputs for Static site app
    const userInputs = [];
    if (args.documentRoot) {
      userInputs.push({ name: "document-root", value: args.documentRoot });
    }
    if (args.siteTitle) {
      userInputs.push({ name: "site-title", value: args.siteTitle });
    }

    // Create the app installation
    const response = await mittwaldClient.app.api.requestAppinstallation({
      projectId,
      data: {
        appVersionId,
        description: args.siteTitle || `Static Site - ${projectId}`,
        updatePolicy: "none",
        userInputs
      }
    });

    if (response.status === 201) {
      if (args.quiet) {
        return formatToolResponse("success", response.data.id);
      }

      return formatToolResponse(
        "success",
        "Static site app creation request submitted successfully",
        {
          appInstallationId: response.data.id,
          status: 'requested',
          siteTitle: args.siteTitle || `Static Site - ${projectId}`,
          documentRoot: args.documentRoot,
          appVersionId
        }
      );
    } else {
      throw new Error(`API request failed with status ${response.status}`);
    }

  } catch (error) {
    return formatToolResponse(
      "error",
      error instanceof Error ? error.message : 'Unknown error occurred'
    );
  }
};