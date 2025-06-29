import type { MittwaldToolHandler, MittwaldToolHandlerContext } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';

interface MittwaldMailDeliveryboxGetArgs {
  id: string;
  output: "txt" | "json" | "yaml";
}

export const handleMailDeliveryboxGet: MittwaldToolHandler<MittwaldMailDeliveryboxGetArgs> = async (args, { mittwaldClient }) => {
  
  try {
    // Get the delivery box
    const getResponse = await mittwaldClient.api.mail.getDeliveryBox({
      deliveryBoxId: args.id
    });

    if (getResponse.status !== 200 || !getResponse.data) {
      return formatToolResponse(
        "error",
        `Failed to get delivery box: Delivery box ${args.id} not found`
      );
    }

    const deliveryBox = getResponse.data;

    // Format output based on requested format
    if (args.output === "json") {
      return formatToolResponse("success", JSON.stringify(deliveryBox, null, 2));
    } else if (args.output === "yaml") {
      // Simple YAML-like formatting
      const yamlOutput = Object.entries(deliveryBox)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n');
      return formatToolResponse("success", yamlOutput);
    } else {
      // Default txt format
      return formatToolResponse("success", deliveryBox);
    }
  } catch (error) {
    return formatToolResponse("error", `Error getting delivery box: ${error instanceof Error ? error.message : String(error)}`);
  }
};