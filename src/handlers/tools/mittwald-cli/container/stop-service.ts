import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';

interface ContainerStopServiceArgs {
  stackId: string;
  serviceId: string;
}

export const handleContainerStopService: MittwaldToolHandler<ContainerStopServiceArgs> = async (args, { mittwaldClient }) => {
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

    // Stop the service using the Mittwald API client
    const response = await mittwaldClient.container.stopService({
      stackId: args.stackId,
      serviceId: args.serviceId
    });

    if (response.status !== 204) {
      return formatToolResponse(
        "error",
        `Failed to stop service: HTTP ${response.status}`
      );
    }

    return formatToolResponse(
      "success",
      `Service ${args.serviceId} in stack ${args.stackId} has been stopped successfully`,
      {
        stackId: args.stackId,
        serviceId: args.serviceId,
        action: "stop"
      }
    );

  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to stop service: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};