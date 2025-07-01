import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { assertStatus } from '@mittwald/api-client-commons';

interface GetStackArgs {
  stackId: string;
}

export const handleContainerGetStack: MittwaldToolHandler<GetStackArgs> = async (args, { mittwaldClient }) => {
  try {
    const response = await mittwaldClient.container.getStack({
      stackId: args.stackId
    });
    
    assertStatus(response, 200);
    
    const stack = response.data;
    
    // Format the stack details
    const stackDetails = {
      id: stack.id,
      projectId: stack.projectId,
      description: stack.description,
      disabled: stack.disabled,
      prefix: stack.prefix,
      services: stack.services?.map(service => ({
        id: service.id,
        name: service.serviceName,
        shortId: service.shortId,
        status: service.status,
        statusSetAt: service.statusSetAt,
        message: service.message,
        image: service.deployedState?.image,
        requiresRecreate: service.requiresRecreate
      })) || [],
      volumes: stack.volumes?.map(volume => ({
        id: volume.id,
        name: volume.name,
        storageUsageInBytes: volume.storageUsageInBytes,
        orphaned: volume.orphaned
      })) || [],
      serviceCount: stack.services?.length || 0,
      volumeCount: stack.volumes?.length || 0
    };
    
    // Create a status summary
    const statusSummary = stackDetails.services.reduce((acc, service) => {
      acc[service.status] = (acc[service.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const summaryText = Object.entries(statusSummary)
      .map(([status, count]) => `${count} ${status}`)
      .join(', ');
    
    return formatToolResponse(
      "success",
      `Stack has ${stackDetails.serviceCount} services (${summaryText || 'none'}) and ${stackDetails.volumeCount} volumes`,
      stackDetails
    );
    
  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to get stack details: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};