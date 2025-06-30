import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { assertStatus } from '@mittwald/api-client-commons';

interface DeclareStackArgs {
  stackId: string;
  desiredServices?: Record<string, {
    imageUri: string;
    environment?: Record<string, string>;
    ports?: Array<{
      containerPort: number;
      protocol?: 'tcp' | 'udp';
    }>;
    volumes?: Array<{
      name: string;
      mountPath: string;
      readOnly?: boolean;
    }>;
  }>;
  desiredVolumes?: Record<string, {
    size?: string;
  }>;
}

export const handleContainerDeclareStack: MittwaldToolHandler<DeclareStackArgs> = async (args, { mittwaldClient }) => {
  try {
    // First get the current stack to find the default stack ID if needed
    let stackId = args.stackId;
    
    // If stackId is "default", we need to find the actual default stack
    if (stackId === 'default' || !stackId) {
      // Extract project ID from the stack operations
      const projectIdMatch = args.stackId?.match(/project-([\w-]+)/);
      if (!projectIdMatch) {
        return formatToolResponse(
          "error",
          "Invalid stack ID format. Expected format: 'default' or actual stack ID"
        );
      }
      
      const projectId = projectIdMatch[1];
      const stacksResponse = await mittwaldClient.container.listStacks({
        projectId
      });
      
      assertStatus(stacksResponse, 200);
      
      // Find the default stack (the first one is usually default)
      const defaultStack = stacksResponse.data?.[0];
      if (!defaultStack) {
        return formatToolResponse(
          "error",
          "No stack found for this project"
        );
      }
      
      stackId = defaultStack.id;
    }
    
    // Prepare the request body
    const requestBody: any = {};
    
    // Convert services to API format
    if (args.desiredServices) {
      requestBody.desiredServices = Object.entries(args.desiredServices).map(([name, config]) => ({
        name,
        imageUri: config.imageUri,
        environment: config.environment || {},
        ports: config.ports?.map(p => ({
          containerPort: p.containerPort,
          protocol: p.protocol || 'tcp'
        })) || [],
        volumes: config.volumes?.map(v => ({
          name: v.name,
          mountPath: v.mountPath,
          readOnly: v.readOnly || false
        })) || []
      }));
    }
    
    // Convert volumes to API format
    if (args.desiredVolumes) {
      requestBody.desiredVolumes = Object.entries(args.desiredVolumes).map(([name, config]) => ({
        name,
        size: config.size
      }));
    }
    
    // Call the declare stack API
    const response = await mittwaldClient.container.declareStack({
      stackId,
      data: requestBody
    });
    
    assertStatus(response, 200);
    
    const result = response.data;
    
    // Prepare summary
    const summary = {
      stackId,
      services: result?.services?.length || 0,
      volumes: result?.volumes?.length || 0,
      requestedServices: Object.keys(args.desiredServices || {}),
      requestedVolumes: Object.keys(args.desiredVolumes || {})
    };
    
    return formatToolResponse(
      "success",
      `Stack declared successfully. Stack now has ${summary.services} services and ${summary.volumes} volumes.`,
      summary
    );
    
  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to declare stack: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};