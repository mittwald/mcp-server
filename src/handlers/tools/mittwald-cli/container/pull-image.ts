import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';

interface ContainerPullImageArgs {
  stackId: string;
  serviceId: string;
}

export const handleContainerPullImage: MittwaldToolHandler<ContainerPullImageArgs> = async (args, { mittwaldClient }) => {
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

    // Pull the latest image for the service using the Mittwald API client
    const response = await mittwaldClient.container.pullImageForService({
      stackId: args.stackId,
      serviceId: args.serviceId
    });

    if (response.status !== 204) {
      return formatToolResponse(
        "error",
        `Failed to pull image: HTTP ${response.status}`
      );
    }

    return formatToolResponse(
      "success",
      `Latest image for service ${args.serviceId} in stack ${args.stackId} has been pulled successfully`,
      {
        stackId: args.stackId,
        serviceId: args.serviceId,
        action: "pull-image"
      }
    );

  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to pull image: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};