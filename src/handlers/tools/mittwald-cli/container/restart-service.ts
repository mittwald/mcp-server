import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';

interface ContainerRestartServiceArgs {
  stackId: string;
  serviceId: string;
}

export const handleContainerRestartService: MittwaldToolHandler<ContainerRestartServiceArgs> = async (args, { mittwaldClient }) => {
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

    // Restart the service using the Mittwald API client
    const response = await mittwaldClient.container.restartService({
      stackId: args.stackId,
      serviceId: args.serviceId
    });

    if (response.status !== 204) {
      return formatToolResponse(
        "error",
        `Failed to restart service: HTTP ${response.status}`
      );
    }

    return formatToolResponse(
      "success",
      `Service ${args.serviceId} in stack ${args.stackId} has been restarted successfully`,
      {
        stackId: args.stackId,
        serviceId: args.serviceId,
        action: "restart"
      }
    );

  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to restart service: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};