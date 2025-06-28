import type { MittwaldToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';

export interface MittwaldAppCreatePythonArgs {
  projectId?: string;
  siteTitle?: string;
  entrypoint?: string;
  quiet?: boolean;
  wait?: boolean;
  waitTimeout?: number;
}

export const handleAppCreatePython: MittwaldToolHandler<MittwaldAppCreatePythonArgs> = async (args, { mittwaldClient }) => {
  try {
    const projectId = args.projectId;
    
    if (!projectId) {
      throw new Error("Project ID is required");
    }

    // Python app ID from CLI source
    const pythonAppId = "be57d166-dae9-4480-bae2-da3f3c6f0a2e";
    
    // Get latest Python app version
    const versionsResponse = await mittwaldClient.app.listAppversions({ 
      appId: pythonAppId 
    });
    
    if (versionsResponse.status !== 200) {
      throw new Error(`Failed to fetch Python app versions: ${versionsResponse.status}`);
    }
    
    // Find the recommended version or latest version
    const versions = versionsResponse.data;
    const recommendedVersion = versions.find(v => v.recommended);
    const appVersionId = recommendedVersion?.id || versions[0]?.id;
    
    if (!appVersionId) {
      throw new Error("No Python app versions available");
    }

    // Prepare user inputs for Python app
    const userInputs = [];
    if (args.siteTitle) {
      userInputs.push({ name: "site-title", value: args.siteTitle });
    }
    if (args.entrypoint) {
      userInputs.push({ name: "entrypoint", value: args.entrypoint });
    }

    // Create the app installation
    const response = await mittwaldClient.app.requestAppinstallation({
      projectId,
      data: {
        appVersionId,
        description: args.siteTitle || `Python - ${projectId}`,
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
        "Python app creation request submitted successfully",
        {
          appInstallationId: response.data.id,
          status: 'requested',
          siteTitle: args.siteTitle || `Python - ${projectId}`,
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