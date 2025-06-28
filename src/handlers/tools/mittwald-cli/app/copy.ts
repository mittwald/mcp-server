import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';

export interface MittwaldAppCopyArgs {
  installationId: string;
  description: string;
  quiet?: boolean;
}

export const handleAppCopy: MittwaldToolHandler<MittwaldAppCopyArgs> = async (args, { mittwaldClient }) => {
  try {
    if (!args.description) {
      throw new Error("Description is required");
    }

    if (!args.installationId) {
      throw new Error("App installation ID is required");
    }

    // Call the actual Mittwald API to copy the app installation
    const response = await mittwaldClient.app.requestAppinstallationCopy({
      appInstallationId: args.installationId,
      data: {
        description: args.description,
        // targetProjectId is optional - if not provided, copies within same project
      }
    });

    if (response.status === 201) {
      if (args.quiet) {
        // Return just the new installation ID for machine-readable output
        return formatToolResponse("success", response.data.id || "copy-requested");
      }

      return formatToolResponse(
        "success",
        "App copy request submitted successfully",
        {
          sourceAppInstallationId: args.installationId,
          newAppInstallationId: response.data.id,
          description: args.description,
          status: "requested"
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