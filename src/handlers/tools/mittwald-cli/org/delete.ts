import type { MittwaldToolHandler } from '../../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { assertStatus } from '@mittwald/api-client';

export interface MittwaldOrgDeleteArgs {
  orgId?: string;
  force?: boolean;
  quiet?: boolean;
}

export const handleOrgDelete: MittwaldToolHandler<MittwaldOrgDeleteArgs> = async (args, { mittwaldClient, orgContext }) => {
  try {
    // Get org ID from args or context
    const orgId = args.orgId || (orgContext as any)?.orgId;
    
    if (!orgId) {
      throw new Error("Organization ID is required. Either provide it as a parameter or set a default org in the context.");
    }

    // In MCP context, force should be true since we can't prompt
    if (!args.force) {
      return formatToolResponse(
        "error",
        "Force flag (-f/--force) is required in MCP context since interactive confirmation is not possible"
      );
    }

    // Delete the organization
    const response = await mittwaldClient.organization.deleteOrganization({
      organizationId: orgId
    });
    assertStatus(response, 204);

    if (args.quiet) {
      return formatToolResponse(
        "success",
        `Organization ${orgId} deleted successfully`,
        { orgId, deleted: true }
      );
    }

    return formatToolResponse(
      "success",
      `✅ Organization ${orgId} has been deleted successfully`
    );

  } catch (error) {
    return formatToolResponse(
      "error",
      error instanceof Error ? error.message : 'Unknown error occurred'
    );
  }
};