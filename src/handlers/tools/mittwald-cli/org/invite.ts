import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { assertStatus } from '@mittwald/api-client';

export interface MittwaldOrgInviteArgs {
  orgId?: string;
  email: string;
  role?: 'owner' | 'member';
  message?: string;
  quiet?: boolean;
}

export const handleOrgInvite: MittwaldToolHandler<MittwaldOrgInviteArgs> = async (args, { mittwaldClient, orgContext }) => {
  try {
    // Get org ID from args or context
    const orgId = args.orgId || (orgContext as any)?.orgId;
    
    if (!orgId) {
      throw new Error("Organization ID is required. Either provide it as a parameter or set a default org in the context.");
    }

    // Invite user to organization
    const response = await mittwaldClient.customer.createOrganizationInvitation({
      organizationId: orgId,
      data: {
        email: args.email,
        role: args.role || 'member',
        message: args.message
      }
    });
    assertStatus(response, 201);

    const invitation = response.data;

    if (args.quiet) {
      return formatToolResponse(
        "success",
        `Invitation sent to ${args.email}`,
        { 
          invitationId: invitation.id,
          email: args.email,
          role: args.role || 'member',
          orgId 
        }
      );
    }

    return formatToolResponse(
      "success",
      `✅ Invitation sent to ${args.email} for organization ${orgId} with role ${args.role || 'member'}`
    );

  } catch (error) {
    return formatToolResponse(
      "error",
      error instanceof Error ? error.message : 'Unknown error occurred'
    );
  }
};