import type { MittwaldToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';

export interface MittwaldAppCreateNodeArgs {
  projectId?: string;
  siteTitle?: string;
  entrypoint?: string;
  quiet?: boolean;
  wait?: boolean;
  waitTimeout?: number;
}

export const handleAppCreateNode: MittwaldToolHandler<MittwaldAppCreateNodeArgs> = async (args, { mittwaldClient }) => {
  try {
    const projectId = args.projectId;
    
    if (!projectId) {
      throw new Error("Project ID is required");
    }

    // Node.js app ID from CLI source
    const nodeJsAppId = "3e7f920b-a711-4d2f-9871-661e1b41a2f0";
    
    // Get latest Node.js app version
    const versionsResponse = await mittwaldClient.api.app.listAppversions({ 
      appId: nodeJsAppId 
    });
    
    if (versionsResponse.status !== 200) {
      throw new Error(`Failed to fetch Node.js app versions: ${versionsResponse.status}`);
    }
    
    // Find the recommended version or latest version
    const versions = versionsResponse.data;
    const recommendedVersion = versions.find((v: any) => v.recommended);
    const appVersionId = recommendedVersion?.id || versions[0]?.id;
    
    if (!appVersionId) {
      throw new Error("No Node.js app versions available");
    }

    // Prepare user inputs for Node.js app
    const userInputs = [];
    if (args.siteTitle) {
      userInputs.push({ name: "site-title", value: args.siteTitle });
    }
    if (args.entrypoint) {
      userInputs.push({ name: "entrypoint", value: args.entrypoint });
    } else {
      userInputs.push({ name: "entrypoint", value: "yarn start" });
    }

    // Create the app installation
    const response = await mittwaldClient.api.app.requestAppinstallation({
      projectId,
      data: {
        appVersionId,
        description: args.siteTitle || `Node.js - ${projectId}`,
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
        "Node.js app creation request submitted successfully",
        {
          appInstallationId: response.data.id,
          status: 'requested',
          siteTitle: args.siteTitle || `Node.js - ${projectId}`,
          entrypoint: args.entrypoint || "yarn start",
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