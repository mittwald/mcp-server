import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';

interface MittwaldDomainVirtualhostDeleteArgs {
  virtualHostId: string;
  force?: boolean;
  quiet?: boolean;
}

export const handleDomainVirtualhostDelete: MittwaldToolHandler<MittwaldDomainVirtualhostDeleteArgs> = async (args, { mittwaldClient }) => {
  try {
    // Validate required parameter
    if (!args.virtualHostId) {
      return formatToolResponse(
        "error",
        "Missing required parameter 'virtualHostId'. Note: Use 'virtualHostId', not 'ingressId'."
      );
    }
    
    // In MCP context, we assume force=true since we can't prompt for confirmation
    if (!args.force && !args.quiet) {
      return formatToolResponse(
        "error",
        "Confirmation required: Use 'force: true' to delete the virtual host without confirmation"
      );
    }

    // Delete the virtual host (ingress)
    await mittwaldClient.domain.ingressDeleteIngress({
      ingressId: args.virtualHostId,
    });

    const resultData = {
      id: args.virtualHostId,
      status: "deleted"
    };

    return formatToolResponse(
      "success",
      args.quiet ? 
        `Virtual host ${args.virtualHostId} deleted` :
        `Successfully deleted virtual host with ID ${args.virtualHostId}`,
      resultData
    );

  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to delete virtual host: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};