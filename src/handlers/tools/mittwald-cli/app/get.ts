import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';

interface AppGetInput {
  installation_id?: string;
  output?: 'txt' | 'json' | 'yaml';
}

export const handleMittwaldAppGet: MittwaldToolHandler<AppGetInput> = async (input, { mittwaldClient }) => {
  try {
    if (!input.installation_id) {
      return formatToolResponse(
        "error",
        "installation_id is required"
      );
    }

    // Get app installation details using the Mittwald API client
    const response = await mittwaldClient.app.getAppinstallation({
      appInstallationId: input.installation_id
    });

    if (response.status !== 200) {
      return formatToolResponse(
        "error",
        `Failed to get app installation: HTTP ${response.status}`
      );
    }

    const appData = response.data;

    // Format the response based on output type
    if (input.output === 'json') {
      return formatToolResponse(
        "success",
        "App installation details retrieved",
        appData
      );
    }

    // Default text output
    const message = `App Installation: ${appData.appId}
ID: ${appData.id}
Version: ${appData.appVersion?.current || 'Unknown'}
Description: ${appData.description || 'No description'}
Status: ${appData.installationPath ? 'Installed' : 'Not installed'}
Path: ${appData.installationPath || 'N/A'}`;

    return formatToolResponse(
      "success",
      message,
      appData
    );

  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to get app details: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}