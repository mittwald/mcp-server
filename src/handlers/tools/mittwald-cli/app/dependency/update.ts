import type { MittwaldToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { assertStatus } from '@mittwald/api-client';

interface AppDependencyUpdateArgs {
  installationId?: string;
  set: string[];
  updatePolicy?: 'none' | 'inheritedFromApp' | 'patchLevel' | 'all';
  quiet?: boolean;
}

// Map common software names to IDs
const SOFTWARE_NAME_MAP: Record<string, string> = {
  'php': '34220303-cb87-4592-8a95-2eb20a97b2ac',
  'nodejs': '3e7f920b-a711-4d2f-9871-661e1b41a2f0',
  'node': '3e7f920b-a711-4d2f-9871-661e1b41a2f0',
  'python': 'be57d166-dae9-4480-bae2-da3f3c6f0a2e',
  'composer': 'composer-id', // Need to find actual ID
  'imagemagick': 'imagemagick-id', // Need to find actual ID
  // Add more mappings as we discover them
};

export const handleMittwaldAppDependencyUpdate: MittwaldToolHandler<AppDependencyUpdateArgs> = async (args, { mittwaldClient }) => {
  try {
    if (!args.installationId) {
      return formatToolResponse(
        "error",
        "App installation ID is required"
      );
    }
    
    if (!args.set || args.set.length === 0) {
      return formatToolResponse(
        "error",
        "At least one dependency must be specified with --set"
      );
    }
    
    // First, get all available system software to build a complete mapping
    const listResponse = await mittwaldClient.app.listSystemsoftwares({});
    assertStatus(listResponse, 200);
    
    const systemSoftwares = listResponse.data || [];
    const softwareMap: Record<string, string> = {};
    
    // Build a map of names to IDs
    systemSoftwares.forEach((sw: any) => {
      if (sw.name) {
        softwareMap[sw.name.toLowerCase()] = sw.id;
      }
    });
    
    // Parse the set parameters
    const systemSoftwareUpdates: Record<string, any> = {};
    
    for (const dep of args.set) {
      const [name, versionSpec] = dep.split('=');
      if (!name || !versionSpec) {
        return formatToolResponse(
          "error",
          `Invalid dependency format: ${dep}. Use format: name=version (e.g., composer=~2)`
        );
      }
      
      // Resolve software name to ID
      const normalizedName = name.toLowerCase();
      let systemSoftwareId = SOFTWARE_NAME_MAP[normalizedName] || softwareMap[normalizedName];
      
      if (!systemSoftwareId) {
        // Try exact match with original name
        const exactMatch = systemSoftwares.find((sw: any) => sw.name === name);
        if (exactMatch) {
          systemSoftwareId = exactMatch.id;
        } else {
          return formatToolResponse(
            "error",
            `Unknown system software: ${name}. Use 'mittwald_app_dependency_list' to see available software.`
          );
        }
      }
      
      // Get available versions for this software
      const versionsResponse = await mittwaldClient.app.listSystemsoftwareversions({
        systemSoftwareId
      });
      assertStatus(versionsResponse, 200);
      
      const versions = versionsResponse.data || [];
      
      // Find matching version
      let selectedVersion: any;
      
      // Handle version specifiers
      if (versionSpec.startsWith('~')) {
        // Patch level updates (e.g., ~2 means 2.x)
        const majorVersion = versionSpec.substring(1);
        selectedVersion = versions.find((v: any) => 
          v.externalVersion?.startsWith(majorVersion + '.') ||
          (v.recommended && v.externalVersion?.startsWith(majorVersion))
        );
      } else if (versionSpec === 'latest' || versionSpec === '*') {
        // Latest version
        selectedVersion = versions.find((v: any) => v.recommended) || versions[0];
      } else {
        // Exact version
        selectedVersion = versions.find((v: any) => 
          v.externalVersion === versionSpec ||
          v.internalVersion === versionSpec
        );
      }
      
      if (!selectedVersion) {
        return formatToolResponse(
          "error",
          `No matching version found for ${name}=${versionSpec}`
        );
      }
      
      systemSoftwareUpdates[systemSoftwareId] = {
        systemSoftwareVersion: selectedVersion.id,
        updatePolicy: args.updatePolicy || 'patchLevel'
      };
    }
    
    // Update the app installation
    const response = await mittwaldClient.app.patchAppinstallation({
      appInstallationId: args.installationId,
      data: {
        systemSoftware: systemSoftwareUpdates
      }
    });
    
    assertStatus(response, 204);
    
    const updatedDeps = Object.entries(systemSoftwareUpdates).map(([id, update]) => {
      const sw = systemSoftwares.find((s: any) => s.id === id);
      return `${sw?.name || id}`;
    });
    
    if (args.quiet) {
      return formatToolResponse("success", args.installationId);
    }
    
    return formatToolResponse(
      "success",
      `Successfully updated system software for app ${args.installationId}`,
      {
        appInstallationId: args.installationId,
        updatedDependencies: updatedDeps,
        updatePolicy: args.updatePolicy || 'patchLevel'
      }
    );

  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to update app dependencies: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};