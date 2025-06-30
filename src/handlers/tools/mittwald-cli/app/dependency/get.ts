import type { MittwaldToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { assertStatus } from '@mittwald/api-client';

interface AppDependencyGetArgs {
  installationId: string;
  output?: 'txt' | 'json' | 'yaml';
}

export const handleMittwaldAppDependencyGet: MittwaldToolHandler<AppDependencyGetArgs> = async (args, { mittwaldClient }) => {
  try {
    if (!args.installationId) {
      return formatToolResponse(
        "error",
        "App installation ID is required"
      );
    }
    
    // Get installed system software for the app
    const response = await mittwaldClient.app.getInstalledSystemsoftwareForAppinstallation({
      appInstallationId: args.installationId
    });
    assertStatus(response, 200);
    
    const installedSoftware = response.data || [];
    const output = args.output || 'txt';
    
    // Get system software details for names
    const listResponse = await mittwaldClient.app.listSystemsoftwares({});
    assertStatus(listResponse, 200);
    const systemSoftwares = listResponse.data || [];
    const softwareMap: Record<string, any> = {};
    systemSoftwares.forEach((sw: any) => {
      softwareMap[sw.id] = sw;
    });
    
    if (output === 'json') {
      return formatToolResponse(
        "success",
        `Found ${installedSoftware.length} installed system software packages`,
        installedSoftware
      );
    }
    
    // Format for text/table output
    const formattedData = installedSoftware.map((sw: any) => {
      const software = softwareMap[sw.systemSoftwareId];
      return {
        Name: software?.name || sw.systemSoftwareId,
        CurrentVersion: sw.systemSoftwareVersion?.current || 'N/A',
        DesiredVersion: sw.systemSoftwareVersion?.desired || 'N/A',
        UpdatePolicy: sw.updatePolicy || 'none',
        Status: sw.systemSoftwareVersion?.current === sw.systemSoftwareVersion?.desired ? 'up-to-date' : 'update-available'
      };
    });
    
    if (output === 'yaml') {
      return formatToolResponse(
        "success",
        `Installed system software for app ${args.installationId}`,
        formattedData
      );
    }
    
    // Default text format
    if (formattedData.length === 0) {
      return formatToolResponse(
        "success",
        "No system software installed for this app",
        []
      );
    }
    
    return formatToolResponse(
      "success",
      `Installed system software for app ${args.installationId}`,
      formattedData
    );

  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to get installed dependencies: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};