import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { assertStatus } from '@mittwald/api-client';

export interface MittwaldAppListArgs {
  projectId?: string;
  output?: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
  extended?: boolean;
  noHeader?: boolean;
  noTruncate?: boolean;
  noRelativeDates?: boolean;
  csvSeparator?: ',' | ';';
}

export const handleAppList: MittwaldToolHandler<MittwaldAppListArgs> = async (args, { mittwaldClient }) => {
  try {
    // Get project ID from args
    const projectId = args.projectId;
    
    if (!projectId) {
      return formatToolResponse(
        'error',
        'Project ID is required. Please provide the projectId parameter.'
      );
    }

    // List app installations for the project
    const response = await mittwaldClient.api.app.listAppinstallations({
      projectId: projectId
    });
    assertStatus(response, 200);

    const apps = response.data || [];

    // Get additional details if extended info is requested
    let extendedApps = apps;
    if (args.extended && apps.length > 0) {
      extendedApps = await Promise.all(
        apps.map(async (app) => {
          try {
            const detailResponse = await mittwaldClient.api.app.getAppinstallation({
              appInstallationId: app.id
            });
            assertStatus(detailResponse, 200);
            return detailResponse.data;
          } catch (error) {
            // If we can't get details, use the basic info
            return app;
          }
        })
      );
    }

    // Format output based on requested format
    const output = args.output || 'txt';
    
    if (output === 'json') {
      return formatToolResponse(
        "success",
        `Found ${extendedApps.length} app(s) in project`,
        extendedApps
      );
    }

    // For text output, create a simplified view
    const formattedApps = extendedApps.map((app: any) => ({
      id: app.id,
      name: app.app?.name || app.appId || 'Unknown',
      version: app.appVersion?.current || 'unknown',
      status: app.appVersion?.current ? 'installed' : 'installing',
      createdAt: app.createdAt || new Date().toISOString()
    }));

    if (output === 'yaml') {
      return formatToolResponse(
        "success",
        `Found ${formattedApps.length} app(s) in project`,
        formattedApps
      );
    }

    if (output === 'csv' || output === 'tsv') {
      const separator = output === 'csv' ? (args.csvSeparator || ',') : '\t';
      const headers = args.noHeader ? '' : `ID${separator}Name${separator}Version${separator}Status${separator}Created\n`;
      const rows = formattedApps.map(app => 
        `${app.id}${separator}${app.name}${separator}${app.version}${separator}${app.status}${separator}${app.createdAt}`
      ).join('\n');
      
      return formatToolResponse(
        "success",
        headers + rows,
        { format: output }
      );
    }

    // Default text format
    if (formattedApps.length === 0) {
      return formatToolResponse(
        "success",
        "No apps found in project",
        []
      );
    }

    // Create a table-like text output
    const tableData = formattedApps.map(app => ({
      "ID": args.noTruncate ? app.id : app.id.substring(0, 8),
      "Name": app.name,
      "Version": app.version,
      "Status": app.status,
      "Created": args.noRelativeDates ? app.createdAt : formatRelativeDate(app.createdAt)
    }));

    return formatToolResponse(
      "success",
      `Found ${formattedApps.length} app(s) in project`,
      tableData
    );

  } catch (error) {
    return formatToolResponse(
      "error",
      error instanceof Error ? error.message : 'Unknown error occurred'
    );
  }
};

// Helper function to format relative dates
function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    }
    return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  } else if (diffDays === 1) {
    return 'yesterday';
  } else if (diffDays < 30) {
    return `${diffDays} days ago`;
  } else if (diffDays < 365) {
    const diffMonths = Math.floor(diffDays / 30);
    return `${diffMonths} month${diffMonths !== 1 ? 's' : ''} ago`;
  } else {
    const diffYears = Math.floor(diffDays / 365);
    return `${diffYears} year${diffYears !== 1 ? 's' : ''} ago`;
  }
}