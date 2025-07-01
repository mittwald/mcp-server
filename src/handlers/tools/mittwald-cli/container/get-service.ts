import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { assertStatus } from '@mittwald/api-client-commons';

interface GetServiceArgs {
  stackId: string;
  serviceId: string;
}

export const handleContainerGetService: MittwaldToolHandler<GetServiceArgs> = async (args, { mittwaldClient }) => {
  try {
    const response = await mittwaldClient.container.getService({
      stackId: args.stackId,
      serviceId: args.serviceId
    });
    
    assertStatus(response, 200);
    
    const service = response.data;
    
    // Format the service details
    const serviceDetails = {
      id: service.id,
      stackId: service.stackId,
      projectId: service.projectId,
      name: service.serviceName,
      shortId: service.shortId,
      description: service.description,
      status: service.status,
      statusSetAt: service.statusSetAt,
      message: service.message,
      requiresRecreate: service.requiresRecreate,
      deployedState: service.deployedState ? {
        image: service.deployedState.image,
        environment: service.deployedState.envs,
        ports: service.deployedState.ports,
        volumes: service.deployedState.volumes,
        command: service.deployedState.command,
        entrypoint: service.deployedState.entrypoint
      } : null,
      pendingState: service.pendingState ? {
        image: service.pendingState.image,
        environment: service.pendingState.envs,
        ports: service.pendingState.ports,
        volumes: service.pendingState.volumes,
        command: service.pendingState.command,
        entrypoint: service.pendingState.entrypoint
      } : null
    };
    
    return formatToolResponse(
      "success",
      `Service ${service.serviceName} (${service.status})`,
      serviceDetails
    );
    
  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to get service details: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};