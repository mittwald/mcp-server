import type { MittwaldToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { assertStatus } from '@mittwald/api-client';

interface AppDependencyVersionsArgs {
  systemsoftware: string;
  output?: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
  extended?: boolean;
  noHeader?: boolean;
  noTruncate?: boolean;
  noRelativeDates?: boolean;
  csvSeparator?: ',' | ';';
}

// Map common software names to IDs
const SOFTWARE_NAME_MAP: Record<string, string> = {
  'php': '34220303-cb87-4592-8a95-2eb20a97b2ac',
  'nodejs': '3e7f920b-a711-4d2f-9871-661e1b41a2f0',
  'node': '3e7f920b-a711-4d2f-9871-661e1b41a2f0',
  'python': 'be57d166-dae9-4480-bae2-da3f3c6f0a2e',
  // Add more mappings as we discover them
};

export const handleMittwaldAppDependencyVersions: MittwaldToolHandler<AppDependencyVersionsArgs> = async (args, { mittwaldClient }) => {
  try {
    if (!args.systemsoftware) {
      return formatToolResponse(
        "error",
        "System software name or ID is required"
      );
    }
    
    // Try to resolve software name to ID
    let systemSoftwareId = args.systemsoftware;
    
    // Check if it's a known name
    const normalizedName = args.systemsoftware.toLowerCase();
    if (SOFTWARE_NAME_MAP[normalizedName]) {
      systemSoftwareId = SOFTWARE_NAME_MAP[normalizedName];
    } else if (!args.systemsoftware.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      // If not a UUID, try to find it in the list
      const listResponse = await mittwaldClient.app.listSystemsoftwares({});
      assertStatus(listResponse, 200);
      
      const software = listResponse.data?.find((sw: any) => 
        sw.name?.toLowerCase() === normalizedName ||
        sw.id === args.systemsoftware
      );
      
      if (software) {
        systemSoftwareId = software.id;
      } else {
        return formatToolResponse(
          "error",
          `System software '${args.systemsoftware}' not found. Use 'mittwald_app_dependency_list' to see available software.`
        );
      }
    }
    
    // Get versions for the system software
    const response = await mittwaldClient.app.listSystemsoftwareversions({
      systemSoftwareId
    });
    assertStatus(response, 200);
    
    const versions = response.data || [];
    const output = args.output || 'txt';
    
    if (output === 'json') {
      return formatToolResponse(
        "success",
        `Found ${versions.length} versions for ${args.systemsoftware}`,
        versions
      );
    }
    
    // Format for text/table output
    const formattedData = versions.map((v: any) => ({
      ID: args.noTruncate ? v.id : v.id.substring(0, 8),
      Version: v.externalVersion || v.internalVersion,
      Internal: v.internalVersion,
      Recommended: v.recommended ? 'Yes' : 'No',
      Status: v.status || 'available'
    }));
    
    if (output === 'yaml') {
      return formatToolResponse(
        "success",
        `Found ${versions.length} versions for ${args.systemsoftware}`,
        formattedData
      );
    }
    
    if (output === 'csv' || output === 'tsv') {
      const separator = output === 'csv' ? (args.csvSeparator || ',') : '\t';
      const headers = args.noHeader ? '' : `ID${separator}Version${separator}Internal${separator}Recommended${separator}Status\n`;
      const rows = formattedData.map(v => 
        `${v.ID}${separator}${v.Version}${separator}${v.Internal}${separator}${v.Recommended}${separator}${v.Status}`
      ).join('\n');
      
      return formatToolResponse(
        "success",
        headers + rows,
        { format: output }
      );
    }
    
    // Default text format
    return formatToolResponse(
      "success",
      `Found ${versions.length} versions for ${args.systemsoftware}`,
      formattedData
    );

  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to get dependency versions: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};