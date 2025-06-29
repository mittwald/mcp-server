import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { assertStatus } from '@mittwald/api-client';

export interface MittwaldProjectInviteListArgs {
  projectId?: string;
  output?: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
  extended?: boolean;
  noHeader?: boolean;
  noTruncate?: boolean;
  noRelativeDates?: boolean;
  csvSeparator?: ',' | ';';
}

export const handleProjectInviteList: MittwaldToolHandler<MittwaldProjectInviteListArgs> = async (args, { mittwaldClient, projectContext }) => {
  try {
    // Get project ID from args or context
    const projectId = args.projectId || (projectContext as any)?.projectId;
    
    if (!projectId) {
      throw new Error("Project ID is required. Either provide it as a parameter or set a default project in the context.");
    }

    // List invites for the project
    const response = await mittwaldClient.project.api.listInvitesForProject({
      projectId: projectId
    });
    assertStatus(response, 200);

    const invites = response.data || [];

    // Get additional details if extended info is requested
    let extendedInvites = invites;
    if (args.extended && invites.length > 0) {
      extendedInvites = await Promise.all(
        invites.map(async (invite) => {
          try {
            // For extended info, we might fetch user details if available
            if (invite.userId) {
              const userResponse = await mittwaldClient.user.api.getUser({
                userId: invite.userId
              });
              assertStatus(userResponse, 200);
              
              return {
                ...invite,
                userDetails: userResponse.data
              };
            }
            return invite;
          } catch (error) {
            // If we can't get user details, use the basic info
            return invite;
          }
        })
      );
    }

    // Format output based on requested format
    const output = args.output || 'txt';
    
    if (output === 'json') {
      return formatToolResponse(
        "success",
        `Found ${extendedInvites.length} invite(s) for project`,
        extendedInvites
      );
    }

    // For text output, create a simplified view
    const formattedInvites = extendedInvites.map(invite => ({
      id: invite.id,
      email: invite.mailAddress,
      userName: invite.userDetails?.person?.name || invite.mailAddress,
      role: invite.projectRole,
      status: invite.expired ? 'expired' : 'active',
      createdAt: invite.createdAt,
      expiresAt: invite.membershipExpiresAt || 'Never'
    }));

    if (output === 'yaml') {
      return formatToolResponse(
        "success",
        `Found ${formattedInvites.length} invite(s) for project`,
        formattedInvites
      );
    }

    if (output === 'csv' || output === 'tsv') {
      const separator = output === 'csv' ? (args.csvSeparator || ',') : '\t';
      const headers = args.noHeader ? '' : `ID${separator}Email${separator}Name${separator}Role${separator}Status${separator}Created${separator}Expires\n`;
      const rows = formattedInvites.map(invite => 
        `${invite.id}${separator}${invite.email}${separator}${invite.userName}${separator}${invite.role}${separator}${invite.status}${separator}${invite.createdAt}${separator}${invite.expiresAt}`
      ).join('\n');
      
      return formatToolResponse(
        "success",
        headers + rows,
        { format: output }
      );
    }

    // Default text format
    if (formattedInvites.length === 0) {
      return formatToolResponse(
        "success",
        "No invites found for project",
        []
      );
    }

    // Create a table-like text output
    const tableData = formattedInvites.map(invite => ({
      "ID": args.noTruncate ? invite.id : invite.id.substring(0, 8),
      "Email": invite.email,
      "Name": args.noTruncate ? invite.userName : invite.userName.substring(0, 25),
      "Role": invite.role,
      "Status": invite.status,
      "Created": args.noRelativeDates ? invite.createdAt : formatRelativeDate(invite.createdAt),
      "Expires": invite.expiresAt === 'Never' ? 'Never' : (args.noRelativeDates ? invite.expiresAt : formatRelativeDate(invite.expiresAt))
    }));

    return formatToolResponse(
      "success",
      `Found ${formattedInvites.length} invite(s) for project`,
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
  
  if (diffMs < 0) {
    // Future date
    const futureDiffMs = Math.abs(diffMs);
    const futureDiffDays = Math.floor(futureDiffMs / (1000 * 60 * 60 * 24));
    
    if (futureDiffDays === 0) {
      const futureDiffHours = Math.floor(futureDiffMs / (1000 * 60 * 60));
      return `in ${futureDiffHours} hour${futureDiffHours !== 1 ? 's' : ''}`;
    } else if (futureDiffDays === 1) {
      return 'tomorrow';
    } else {
      return `in ${futureDiffDays} days`;
    }
  }
  
  // Past date
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