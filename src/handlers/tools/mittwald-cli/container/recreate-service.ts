import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';

interface ContainerRecreateServiceArgs {
  stackId: string;
  serviceId: string;
}

export const handleContainerRecreateService: MittwaldToolHandler<ContainerRecreateServiceArgs> = async (args, { mittwaldClient }) => {
  try {
    if (!args.stackId) {
      return formatToolResponse(
        "error",
        "stackId is required"
      );
    }

    if (!args.serviceId) {
      return formatToolResponse(
        "error",
        "serviceId is required"
      );
    }

    // Recreate the service using the Mittwald API client
    const response = await mittwaldClient.container.recreateService({
      stackId: args.stackId,
      serviceId: args.serviceId
    });

    if (response.status !== 204) {
      return formatToolResponse(
        "error",
        `Failed to recreate service: HTTP ${response.status}`
      );
    }

    return formatToolResponse(
      "success",
      `Service ${args.serviceId} in stack ${args.stackId} has been recreated successfully`,
      {
        stackId: args.stackId,
        serviceId: args.serviceId,
        action: "recreate"
      }
    );

  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to recreate service: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};