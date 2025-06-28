import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { assertStatus } from '@mittwald/api-client';

export interface MittwaldOrgListArgs {
  output?: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
  extended?: boolean;
  noHeader?: boolean;
  noTruncate?: boolean;
  noRelativeDates?: boolean;
  csvSeparator?: ',' | ';';
}

export const handleOrgList: MittwaldToolHandler<MittwaldOrgListArgs> = async (args, { mittwaldClient }) => {
  try {
    // List customers the user has access to
    const response = await mittwaldClient.customer.listCustomers({});
    assertStatus(response, 200);

    const orgs = response.data || [];
    const output = args.output || 'txt';

    if (output === 'json') {
      return formatToolResponse(
        "success",
        `Found ${orgs.length} organization(s)`,
        orgs
      );
    }

    if (output === 'yaml') {
      return formatToolResponse(
        "success",
        `Found ${orgs.length} organization(s)`,
        orgs
      );
    }

    if (output === 'csv' || output === 'tsv') {
      const separator = output === 'csv' ? (args.csvSeparator || ',') : '\t';
      const headers = args.noHeader ? '' : `ID${separator}Name${separator}Status${separator}Created\n`;
      const rows = orgs.map((org: any) => 
        `${org.id}${separator}${org.name || ''}${separator}${org.enabled ? 'Enabled' : 'Disabled'}${separator}${org.createdAt || ''}`
      ).join('\n');
      
      return formatToolResponse(
        "success",
        headers + rows,
        { format: output }
      );
    }

    // Default text format
    if (orgs.length === 0) {
      return formatToolResponse(
        "success",
        "No organizations found",
        []
      );
    }

    const formattedOrgs = orgs.map((org: any) => ({
      "ID": args.noTruncate ? org.id : org.id.substring(0, 8),
      "Name": org.name || 'Unnamed',
      "Status": org.enabled ? 'Enabled' : 'Disabled',
      "Created": args.noRelativeDates ? org.createdAt : formatRelativeDate(org.createdAt)
    }));

    return formatToolResponse(
      "success",
      `Found ${orgs.length} organization(s)`,
      formattedOrgs
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
  if (!dateString) return 'Unknown';
  
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