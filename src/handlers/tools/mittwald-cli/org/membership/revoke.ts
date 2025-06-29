import type { MittwaldToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { assertStatus } from '@mittwald/api-client';

export interface MittwaldOrgMembershipRevokeArgs {
  membershipId: string;
  quiet?: boolean;
}

export const handleOrgMembershipRevoke: MittwaldToolHandler<MittwaldOrgMembershipRevokeArgs> = async (args, { mittwaldClient }) => {
  try {
    // First, get the membership details to retrieve user information for confirmation
    let userEmail = 'unknown';
    try {
      const membershipResponse = await mittwaldClient.api.customer.getCustomerMembership({
        customerMembershipId: args.membershipId
      });
      assertStatus(membershipResponse, 200);
      
      // Get user details for display purposes
      const userResponse = await mittwaldClient.user.getUser({
        userId: membershipResponse.data.userId
      });
      assertStatus(userResponse, 200);
      
      userEmail = userResponse.data.email || 'unknown';
    } catch (error) {
      // If we can't get user details, we'll still proceed with revocation
      // This matches the CLI behavior where user details are just for display
    }

    // Revoke the membership
    const response = await mittwaldClient.api.customer.deleteCustomerMembership({
      customerMembershipId: args.membershipId
    });
    assertStatus(response, 204);

    // Format response based on quiet flag
    if (args.quiet) {
      return formatToolResponse(
        "success",
        JSON.stringify({
          membershipId: args.membershipId,
          userEmail: userEmail,
          status: "revoked"
        }),
        { format: "json" }
      );
    }

    return formatToolResponse(
      "success",
      `Successfully revoked membership for user ${userEmail} (membership ID: ${args.membershipId})`,
      {
        membershipId: args.membershipId,
        userEmail: userEmail,
        status: "revoked"
      }
    );

  } catch (error) {
    return formatToolResponse(
      "error",
      error instanceof Error ? error.message : 'Unknown error occurred'
    );
  }
};