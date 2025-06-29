import type { MittwaldToolHandler, MittwaldToolHandlerContext } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';

interface MittwaldMailDeliveryboxDeleteArgs {
  id: string;
  force: boolean;
  quiet?: boolean;
}

export const handleMailDeliveryboxDelete: MittwaldToolHandler<MittwaldMailDeliveryboxDeleteArgs> = async (args, { mittwaldClient }) => {
  
  try {
    // Force flag is required in MCP context since interactive confirmation is not possible
    if (!args.force) {
      return formatToolResponse(
        "error",
        "Force flag is required for deletion in MCP context. Use --force to confirm deletion."
      );
    }

    // Delete the delivery box
    const deleteResponse = await mittwaldClient.mail.deleteDeliveryBox({
      deliveryBoxId: args.id
    });

    if (deleteResponse.status !== 204) {
      return formatToolResponse(
        "error",
        `Failed to delete delivery box: ${deleteResponse.status}`
      );
    }

    // Prepare response
    const result = {
      deliveryBoxId: args.id,
      success: true,
      message: "Mail delivery box deleted successfully"
    };

    if (args.quiet) {
      return formatToolResponse("success", "");
    }

    return formatToolResponse("success", result.message, result);
  } catch (error) {
    return formatToolResponse("error", `Error deleting delivery box: ${error instanceof Error ? error.message : String(error)}`);
  }
};