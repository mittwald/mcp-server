import type { MittwaldToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { assertStatus } from '@mittwald/api-client';

export interface MittwaldOrgMembershipListOwnArgs {
  output?: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
  extended?: boolean;
  noHeader?: boolean;
  noTruncate?: boolean;
  noRelativeDates?: boolean;
  csvSeparator?: ',' | ';';
}

export const handleOrgMembershipListOwn: MittwaldToolHandler<MittwaldOrgMembershipListOwnArgs> = async (args, { mittwaldClient }) => {
  try {
    // List user's own organization memberships
    const response = await mittwaldClient.organization.listOrganizationMemberships();
    assertStatus(response, 200);

    const memberships = response.data || [];
    const output = args.output || 'txt';

    if (output === 'json') {
      return formatToolResponse(
        "success",
        `Found ${memberships.length} membership(s)`,
        memberships
      );
    }

    if (output === 'yaml') {
      return formatToolResponse(
        "success",
        `Found ${memberships.length} membership(s)`,
        memberships
      );
    }

    if (output === 'csv' || output === 'tsv') {
      const separator = output === 'csv' ? (args.csvSeparator || ',') : '\t';
      const headers = args.noHeader ? '' : `ID${separator}Organization${separator}Role${separator}Status${separator}Created\n`;
      const rows = memberships.map(membership => 
        `${membership.id}${separator}${membership.organization?.name || membership.organizationId}${separator}${membership.role}${separator}${membership.status}${separator}${membership.createdAt || ''}`
      ).join('\n');
      
      return formatToolResponse(
        "success",
        headers + rows,
        { format: output }
      );
    }

    // Default text format
    if (memberships.length === 0) {
      return formatToolResponse(
        "success",
        "No organization memberships found",
        []
      );
    }

    const formattedMemberships = memberships.map(membership => ({
      "ID": args.noTruncate ? membership.id : membership.id.substring(0, 8),
      "Organization": membership.organization?.name || membership.organizationId,
      "Role": membership.role,
      "Status": membership.status,
      "Created": args.noRelativeDates ? membership.createdAt : formatRelativeDate(membership.createdAt)
    }));

    return formatToolResponse(
      "success",
      `Found ${memberships.length} membership(s)`,
      formattedMemberships
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