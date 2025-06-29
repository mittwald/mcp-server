import type { MittwaldToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { assertStatus } from '@mittwald/api-client';

export interface MittwaldOrgMembershipListArgs {
  orgId?: string;
  output?: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
  extended?: boolean;
  noHeader?: boolean;
  noTruncate?: boolean;
  noRelativeDates?: boolean;
  csvSeparator?: ',' | ';';
}

export const handleOrgMembershipList: MittwaldToolHandler<MittwaldOrgMembershipListArgs> = async (args, { mittwaldClient }) => {
  try {
    // Get org ID from args
    const orgId = args.orgId;
    
    if (!orgId) {
      return formatToolResponse(
        'error',
        'Organization ID is required. Please provide the orgId parameter.'
      );
    }

    // List memberships for the organization
    const response = await mittwaldClient.api.customer.listMembershipsForCustomer({
      customerId: orgId
    });
    assertStatus(response, 200);

    const memberships = response.data || [];

    // Get additional details if extended info is requested
    let extendedMemberships = memberships;
    if (args.extended && memberships.length > 0) {
      extendedMemberships = await Promise.all(
        memberships.map(async (membership) => {
          try {
            // Get user details for each membership
            const userResponse = await mittwaldClient.api.user.getUser({
              userId: membership.userId
            });
            assertStatus(userResponse, 200);
            
            return {
              ...membership,
              userDetails: userResponse.data
            };
          } catch (error) {
            // If we can't get user details, use the basic info
            return membership;
          }
        })
      );
    }

    // Format output based on requested format
    const output = args.output || 'txt';
    
    if (output === 'json') {
      return formatToolResponse(
        "success",
        `Found ${extendedMemberships.length} membership(s) in organization`,
        extendedMemberships
      );
    }

    // For text output, create a simplified view
    const formattedMemberships = extendedMemberships.map((membership: any) => ({
      userId: membership.userId,
      userEmail: membership.userDetails?.email || 'unknown',
      userName: membership.userDetails?.person?.firstName || 'unknown',
      role: membership.role,
      memberSince: membership.memberSince
    }));

    if (output === 'yaml') {
      return formatToolResponse(
        "success",
        `Found ${formattedMemberships.length} membership(s) in organization`,
        formattedMemberships
      );
    }

    if (output === 'csv' || output === 'tsv') {
      const separator = output === 'csv' ? (args.csvSeparator || ',') : '\t';
      const headers = args.noHeader ? '' : `User ID${separator}Email${separator}Name${separator}Role${separator}Member Since\n`;
      const rows = formattedMemberships.map(membership => 
        `${membership.userId}${separator}${membership.userEmail}${separator}${membership.userName}${separator}${membership.role}${separator}${membership.memberSince}`
      ).join('\n');
      
      return formatToolResponse(
        "success",
        headers + rows,
        { format: output }
      );
    }

    // Default text format
    if (formattedMemberships.length === 0) {
      return formatToolResponse(
        "success",
        "No memberships found in organization",
        []
      );
    }

    // Create a table-like text output
    const tableData = formattedMemberships.map(membership => ({
      "User ID": args.noTruncate ? membership.userId : membership.userId.substring(0, 8),
      "Email": membership.userEmail,
      "Name": membership.userName,
      "Role": membership.role,
      "Member Since": args.noRelativeDates ? membership.memberSince : formatRelativeDate(membership.memberSince)
    }));

    return formatToolResponse(
      "success",
      `Found ${formattedMemberships.length} membership(s) in organization`,
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