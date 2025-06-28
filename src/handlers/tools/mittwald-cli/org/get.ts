import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { assertStatus } from '@mittwald/api-client';

export interface MittwaldOrgGetArgs {
  orgId?: string;
  output?: 'txt' | 'json' | 'yaml';
}

export const handleOrgGet: MittwaldToolHandler<MittwaldOrgGetArgs> = async (args, { mittwaldClient, orgContext }) => {
  try {
    // Get org ID from args or context
    const orgId = args.orgId || (orgContext as any)?.orgId;
    
    if (!orgId) {
      throw new Error("Organization ID is required. Either provide it as a parameter or set a default org in the context.");
    }

    // Get the organization
    const response = await mittwaldClient.customer.getOrganization({
      organizationId: orgId
    });
    assertStatus(response, 200);

    const org = response.data;
    const output = args.output || 'txt';

    if (output === 'json') {
      return formatToolResponse(
        "success",
        `Organization ${orgId} details`,
        org
      );
    }

    if (output === 'yaml') {
      return formatToolResponse(
        "success",
        `Organization ${orgId} details`,
        org
      );
    }

    // Default text format
    const orgDetails = [
      `Organization: ${org.name || org.id}`,
      `ID: ${org.id}`,
      `Status: ${org.enabled ? 'Enabled' : 'Disabled'}`,
      org.description ? `Description: ${org.description}` : null,
      org.createdAt ? `Created: ${org.createdAt}` : null
    ].filter(Boolean).join('\n');

    return formatToolResponse(
      "success",
      orgDetails
    );

  } catch (error) {
    return formatToolResponse(
      "error",
      error instanceof Error ? error.message : 'Unknown error occurred'
    );
  }
};