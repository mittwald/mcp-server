import { formatToolResponse } from '../../../../../utils/format-tool-response.js';

interface AppVersion {
  id: string;
  externalVersion: string;
  recommended?: boolean;
}

/**
 * Validates that a version string matches an available version for the app
 * @param appName - Name of the app (for error messages)
 * @param requestedVersion - Version string from user
 * @param availableVersions - List of available versions from API
 * @returns Object with either appVersionId or error response
 */
export function validateAppVersion(
  appName: string,
  requestedVersion: string | undefined,
  availableVersions: AppVersion[]
): { appVersionId?: string; error?: ReturnType<typeof formatToolResponse> } {
  
  if (!requestedVersion) {
    return {
      error: formatToolResponse(
        "error", 
        `Version is required. Please use mittwald_app_versions to get valid ${appName} versions and specify one explicitly.`
      )
    };
  }
  
  if (requestedVersion === 'latest') {
    return {
      error: formatToolResponse(
        "error", 
        `'latest' is not a valid version. Please use mittwald_app_versions to get valid ${appName} versions and choose the recommended version or a specific version from the list.`
      )
    };
  }
  
  const specificVersion = availableVersions.find((v: any) => v.externalVersion === requestedVersion);
  if (!specificVersion) {
    const availableVersionsList = availableVersions
      .map((v: any) => v.externalVersion)
      .slice(0, 10) // Show first 10 versions
      .join(', ');
    const moreVersionsText = availableVersions.length > 10 ? ` (and ${availableVersions.length - 10} more)` : '';
    
    return {
      error: formatToolResponse(
        "error", 
        `${appName} version '${requestedVersion}' not found. Valid versions include: ${availableVersionsList}${moreVersionsText}. Use mittwald_app_versions to see all available versions.`
      )
    };
  }
  
  return { appVersionId: specificVersion.id };
}