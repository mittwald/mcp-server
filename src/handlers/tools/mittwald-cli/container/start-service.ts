import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';

interface ContainerStartServiceArgs {
  stackId: string;
  serviceId: string;
}

export const handleContainerStartService: MittwaldToolHandler<ContainerStartServiceArgs> = async (args, { mittwaldClient }) => {
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

    // Start the service using the Mittwald API client
    const response = await mittwaldClient.container.startService({
      stackId: args.stackId,
      serviceId: args.serviceId
    });

    if (response.status !== 204) {
      return formatToolResponse(
        "error",
        `Failed to start service: HTTP ${response.status}`
      );
    }

    return formatToolResponse(
      "success",
      `Service ${args.serviceId} in stack ${args.stackId} has been started successfully`,
      {
        stackId: args.stackId,
        serviceId: args.serviceId,
        action: "start"
      }
    );

  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to start service: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};