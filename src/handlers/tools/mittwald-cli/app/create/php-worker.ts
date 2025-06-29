import type { MittwaldToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';

export interface MittwaldAppCreatePhpWorkerArgs {
  projectId?: string;
  siteTitle?: string;
  entrypoint?: string;
  quiet?: boolean;
  wait?: boolean;
  waitTimeout?: number;
}

export const handleAppCreatePhpWorker: MittwaldToolHandler<MittwaldAppCreatePhpWorkerArgs> = async (args, { mittwaldClient }) => {
  try {
    const projectId = args.projectId;
    
    if (!projectId) {
      throw new Error("Project ID is required");
    }

    // PHP Worker app ID from CLI source
    const phpWorkerAppId = "fcac178a-e606-4460-a5fd-b3ad0ae7a3cc";
    
    // Get latest PHP Worker app version
    const versionsResponse = await mittwaldClient.api.app.listAppversions({ 
      appId: phpWorkerAppId 
    });
    
    if (versionsResponse.status !== 200) {
      throw new Error(`Failed to fetch PHP Worker app versions: ${versionsResponse.status}`);
    }
    
    // Find the recommended version or latest version
    const versions = versionsResponse.data;
    const recommendedVersion = versions.find((v: any) => v.recommended);
    const appVersionId = recommendedVersion?.id || versions[0]?.id;
    
    if (!appVersionId) {
      throw new Error("No PHP Worker app versions available");
    }

    // Prepare user inputs for PHP Worker app
    const userInputs = [];
    if (args.entrypoint) {
      userInputs.push({ name: "entrypoint", value: args.entrypoint });
    }
    if (args.siteTitle) {
      userInputs.push({ name: "site-title", value: args.siteTitle });
    }

    // Create the app installation
    const response = await mittwaldClient.api.app.requestAppinstallation({
      projectId,
      data: {
        appVersionId,
        description: args.siteTitle || `PHP Worker - ${projectId}`,
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
        "PHP worker app creation request submitted successfully",
        {
          appInstallationId: response.data.id,
          status: 'requested',
          siteTitle: args.siteTitle || `PHP Worker - ${projectId}`,
          entrypoint: args.entrypoint,
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