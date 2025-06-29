import type { MittwaldToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';

export interface MittwaldAppCreatePhpArgs {
  projectId?: string;
  documentRoot: string;
  siteTitle?: string;
  quiet?: boolean;
  wait?: boolean;
  waitTimeout?: number;
}

export const handleAppCreatePhp: MittwaldToolHandler<MittwaldAppCreatePhpArgs> = async (args, { mittwaldClient }) => {
  try {
    const projectId = args.projectId;
    
    if (!projectId) {
      throw new Error("Project ID is required");
    }

    // PHP app ID from CLI source
    const phpAppId = "34220303-cb87-4592-8a95-2eb20a97b2ac";
    
    // Get latest PHP app version
    const versionsResponse = await mittwaldClient.app.listAppversions({ 
      appId: phpAppId 
    });
    
    if (versionsResponse.status !== 200) {
      throw new Error(`Failed to fetch PHP app versions: ${versionsResponse.status}`);
    }
    
    // Find the recommended version or latest version
    const versions = versionsResponse.data;
    const recommendedVersion = versions.find((v: any) => v.recommended);
    const appVersionId = recommendedVersion?.id || versions[0]?.id;
    
    if (!appVersionId) {
      throw new Error("No PHP app versions available");
    }

    // Prepare user inputs for PHP app
    const userInputs = [];
    if (args.documentRoot) {
      userInputs.push({ name: "document-root", value: args.documentRoot });
    }
    if (args.siteTitle) {
      userInputs.push({ name: "site-title", value: args.siteTitle });
    }

    // Create the app installation
    const response = await mittwaldClient.app.requestAppinstallation({
      projectId,
      data: {
        appVersionId,
        description: args.siteTitle || `PHP - ${projectId}`,
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
        "PHP app creation request submitted successfully",
        {
          appInstallationId: response.data.id,
          status: 'requested',
          siteTitle: args.siteTitle || `PHP - ${projectId}`,
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