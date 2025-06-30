import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { assertStatus } from '@mittwald/api-client';
import { filterAppDataForLLM } from '../../../../utils/version-filter.js';

export interface MittwaldAppVersionsArgs {
  app?: string;
  output?: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
  extended?: boolean;
  noHeader?: boolean;
  noTruncate?: boolean;
  noRelativeDates?: boolean;
  csvSeparator?: ',' | ';';
}

export const handleAppVersions: MittwaldToolHandler<MittwaldAppVersionsArgs> = async (args, { mittwaldClient }) => {
  try {
    const { app, output = 'txt' } = args;

    // Note: This handler returns filtered versions (latest per major version) to reduce LLM token usage.
    // ALL versions are still available for installation - users can specify any exact version
    // when installing apps, even if not shown in this filtered list.

    // Get all available apps
    const appsResponse = await mittwaldClient.app.listApps({});
    assertStatus(appsResponse, 200);
    
    const allApps = appsResponse.data;
    let targetApps = allApps;

    // If a specific app is provided, filter for that app
    if (app) {
      // Check if app is a UUID or app name
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(app);
      
      if (isUuid) {
        targetApps = allApps.filter(a => a.id === app);
      } else {
        targetApps = allApps.filter(a => a.name.toLowerCase() === app.toLowerCase());
      }

      if (targetApps.length === 0) {
        return formatToolResponse(
          "error",
          `App "${app}" not found. Available apps: ${allApps.map(a => a.name).join(', ')}`
        );
      }
    }

    // Get versions for each target app
    const appsWithVersions = [];
    
    for (const appItem of targetApps) {
      try {
        const versionsResponse = await mittwaldClient.app.listAppversions({
          appId: appItem.id
        });
        assertStatus(versionsResponse, 200);

        const versions = versionsResponse.data.map(version => ({
          id: version.id,
          externalVersion: version.externalVersion,
          internalVersion: version.internalVersion,
          supported: (version as any).supported || false,
          deprecated: (version as any).deprecated || false,
          current: (version as any).current || false
        }));

        // Apply filtering for LLM consumption
        const filteredApp = filterAppDataForLLM({
          id: appItem.id,
          name: appItem.name,
          description: (appItem as any).description || '',
          versions: versions
        });

        appsWithVersions.push(filteredApp);
      } catch (error) {
        // If we can't get versions for an app, include it with empty versions
        appsWithVersions.push({
          id: appItem.id,
          name: appItem.name,
          versions: [],
          error: `Could not fetch versions: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    }

    // Format output based on requested format
    if (output === 'json') {
      return formatToolResponse(
        "success",
        "App versions retrieved",
        { apps: appsWithVersions }
      );
    }

    // For text output, format as readable text
    const formattedOutput = appsWithVersions.map(app => {
      const versionsText = app.versions.length > 0 
        ? app.versions.map(v => `  ${v.externalVersion}`).join('\n')
        : '  No versions available';
      
      return `${app.name}:\n${versionsText}`;
    }).join('\n\n');

    return formatToolResponse(
      "success",
      app ? `Versions for app "${app}"` : "All app versions",
      {
        output: formattedOutput,
        summary: `Found ${appsWithVersions.length} app(s) showing latest version per major release`,
        totalVersionsShown: appsWithVersions.reduce((sum, app) => sum + app.versions.length, 0),
        note: "All versions remain available for installation - specify exact version when installing"
      }
    );

  } catch (error) {
    return formatToolResponse(
      "error",
      error instanceof Error ? error.message : 'Unknown error occurred'
    );
  }
};