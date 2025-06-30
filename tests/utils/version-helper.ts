/**
 * Helper for fetching app versions for tests
 */

import { MCPTestClient } from './mcp-test-client';
import { parseToolContent } from './test-helpers';
import { logger } from '../../src/utils/logger';

export interface AppVersionInfo {
  appType: string;
  version: string;
}

/**
 * Fetches the recommended or latest version for an app type
 */
export async function fetchAppVersion(
  client: MCPTestClient,
  appType: string
): Promise<string | undefined> {
  try {
    const versionsResponse = await client.callTool('mittwald_app_versions', {
      app: appType,
      output: 'json'
    });
    
    const versionsContent = parseToolContent(versionsResponse.result);
    
    // Handle the filtered version structure
    if (versionsContent.data?.apps?.[0]?.versions) {
      const versions = versionsContent.data.apps[0].versions;
      // Find recommended version or use the first one
      const recommendedVersion = versions.find((v: any) => v.recommended);
      return recommendedVersion?.externalVersion || versions[0]?.externalVersion;
    }
    
    return undefined;
  } catch (error) {
    logger.error(`Failed to fetch versions for ${appType}:`, error);
    return undefined;
  }
}

/**
 * Fetches versions for multiple app types
 */
export async function fetchAppVersions(
  client: MCPTestClient,
  appTypes: string[]
): Promise<Record<string, string>> {
  const appVersions: Record<string, string> = {};
  
  logger.info('Fetching versions for app types...');
  
  for (const appType of appTypes) {
    const version = await fetchAppVersion(client, appType);
    if (version) {
      appVersions[appType] = version;
      logger.info(`  ${appType}: version ${version}`);
    } else {
      logger.warn(`  ${appType}: no version found, will be skipped`);
    }
  }
  
  return appVersions;
}