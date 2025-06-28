import type { MittwaldToolHandler, MittwaldToolHandlerContext } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';

interface MittwaldMailDeliveryboxListArgs {
  output: "txt" | "json" | "yaml" | "csv" | "tsv";
  projectId?: string;
  extended?: boolean;
  noHeader?: boolean;
  noTruncate?: boolean;
  noRelativeDates?: boolean;
  csvSeparator?: "," | ";";
}

export const handleMailDeliveryboxList: MittwaldToolHandler<MittwaldMailDeliveryboxListArgs> = async (args, { mittwaldClient }) => {
  
  try {
    // List delivery boxes for the project
    const listResponse = await mittwaldClient.api.mail.deliveryBoxListDeliveryBoxes({
      projectId: args.projectId!
    });

    if (listResponse.status !== 200 || !listResponse.data) {
      return formatToolResponse(
        "error",
        `Failed to list delivery boxes for project ${args.projectId}`
      );
    }

    const deliveryBoxes = listResponse.data;

    // Format output based on requested format
    if (args.output === "json") {
      return formatToolResponse("success", JSON.stringify(deliveryBoxes, null, 2));
    } else if (args.output === "yaml") {
      const yamlOutput = deliveryBoxes.map((box: any, index: number) => 
        `- item${index}:\n` + Object.entries(box)
          .map(([key, value]) => `    ${key}: ${value}`)
          .join('\n')
      ).join('\n');
      return formatToolResponse("success", yamlOutput);
    } else if (args.output === "csv" || args.output === "tsv") {
      const separator = args.output === "csv" ? (args.csvSeparator || ",") : "\t";
      if (deliveryBoxes.length === 0) {
        return formatToolResponse("success", "");
      }
      
      const headers = Object.keys(deliveryBoxes[0]);
      let csvOutput = "";
      
      if (!args.noHeader) {
        csvOutput += headers.join(separator) + "\n";
      }
      
      csvOutput += deliveryBoxes.map((box: any) => 
        headers.map(header => box[header] || "").join(separator)
      ).join("\n");
      
      return formatToolResponse("success", csvOutput);
    } else {
      // Default txt format
      return formatToolResponse("success", deliveryBoxes);
    }
  } catch (error) {
    return formatToolResponse("error", `Error listing delivery boxes: ${error instanceof Error ? error.message : String(error)}`);
  }
};