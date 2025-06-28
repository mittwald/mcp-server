import type { MittwaldToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { assertStatus } from '@mittwald/api-client';

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

    // Get all available apps
    const appsResponse = await mittwaldClient.app.listApps();
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
          supported: version.supported,
          deprecated: version.deprecated,
          current: version.current
        }));

        appsWithVersions.push({
          id: appItem.id,
          name: appItem.name,
          description: appItem.description,
          versions: versions
        });
      } catch (error) {
        // If we can't get versions for an app, include it with empty versions
        appsWithVersions.push({
          id: appItem.id,
          name: appItem.name,
          description: appItem.description,
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
        ? app.versions.map(v => {
            const status = [];
            if (v.current) status.push('current');
            if (v.deprecated) status.push('deprecated');
            if (!v.supported) status.push('unsupported');
            const statusText = status.length > 0 ? ` (${status.join(', ')})` : '';
            return `  ${v.externalVersion}${statusText}`;
          }).join('\n')
        : '  No versions available';
      
      return `${app.name}:\n${versionsText}`;
    }).join('\n\n');

    return formatToolResponse(
      "success",
      app ? `Versions for app "${app}"` : "All app versions",
      {
        output: formattedOutput,
        summary: `Found ${appsWithVersions.length} app(s) with versions`,
        totalVersions: appsWithVersions.reduce((sum, app) => sum + app.versions.length, 0)
      }
    );

  } catch (error) {
    return formatToolResponse(
      "error",
      error instanceof Error ? error.message : 'Unknown error occurred'
    );
  }
};