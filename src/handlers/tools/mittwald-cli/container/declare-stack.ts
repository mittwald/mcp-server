import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { assertStatus } from '@mittwald/api-client-commons';

interface DeclareStackArgs {
  stackId: string;
  desiredServices?: Record<string, {
    imageUri: string;
    description?: string;
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
    command?: string[];
    entrypoint?: string[];
  }>;
  desiredVolumes?: Record<string, {
    size?: string;
  }>;
}

export const handleContainerDeclareStack: MittwaldToolHandler<DeclareStackArgs> = async (args, { mittwaldClient }) => {
  try {
    // Stack ID must be a valid UUID
    const stackId = args.stackId;
    
    if (!stackId) {
      return formatToolResponse(
        "error",
        "Stack ID is required. Please provide a valid stack UUID."
      );
    }
    
    // Validate that stackId looks like a UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(stackId)) {
      return formatToolResponse(
        "error",
        `Invalid stack ID format: ${stackId}. Stack ID must be a valid UUID. Use 'mittwald_container_list_stacks' to find valid stack IDs for a project.`
      );
    }
    
    // Validate services before processing
    if (args.desiredServices) {
      const validationErrors: string[] = [];
      
      for (const [serviceName, config] of Object.entries(args.desiredServices)) {
        // Validate required fields
        if (!config.imageUri) {
          validationErrors.push(`Service '${serviceName}': imageUri is required`);
        }
        
        // Validate ports - required field even if empty
        if (!config.ports) {
          validationErrors.push(`Service '${serviceName}': ports array is required (use empty array [] if no ports needed)`);
        }
        
        // Validate port configurations
        if (config.ports && config.ports.length > 0) {
          config.ports.forEach((port, index) => {
            if (!port.containerPort) {
              validationErrors.push(`Service '${serviceName}': ports[${index}].containerPort is required`);
            }
          });
        }
        
        // Validate volume configurations
        if (config.volumes && config.volumes.length > 0) {
          config.volumes.forEach((volume, index) => {
            if (!volume.name) {
              validationErrors.push(`Service '${serviceName}': volumes[${index}].name is required`);
            }
            if (!volume.mountPath) {
              validationErrors.push(`Service '${serviceName}': volumes[${index}].mountPath is required`);
            }
          });
        }
      }
      
      if (validationErrors.length > 0) {
        return formatToolResponse(
          "error",
          "Invalid service configuration:\n" + validationErrors.join("\n")
        );
      }
    }
    
    // Prepare the request body
    const requestBody: any = {};
    
    // Convert services to API format - API expects an object, not an array
    if (args.desiredServices) {
      requestBody.services = {};
      for (const [serviceName, config] of Object.entries(args.desiredServices)) {
        // Ensure all required fields are present
        const service: any = {
          image: config.imageUri, // API expects 'image', not 'imageUri'
          description: config.description || `${serviceName} container`,
          ports: config.ports?.map(p => `${p.containerPort}/${p.protocol || 'tcp'}`) || [] // Format: "80/tcp"
        };
        
        // Add optional fields
        if (config.environment && Object.keys(config.environment).length > 0) {
          service.envs = config.environment; // API expects 'envs', not 'environment'
        }
        
        if (config.volumes && config.volumes.length > 0) {
          service.volumes = config.volumes.map(v => {
            // Format: "volume-name:/mount/path" or "volume-name:/mount/path:ro"
            const mode = v.readOnly ? ':ro' : '';
            return `${v.name}:${v.mountPath}${mode}`;
          });
        }
        
        requestBody.services[serviceName] = service;
        
        // Add optional fields
        if (config.command) {
          requestBody.services[serviceName].command = config.command;
        }
        if (config.entrypoint) {
          requestBody.services[serviceName].entrypoint = config.entrypoint;
        }
      }
    }
    
    // Convert volumes to API format - API expects an object, not an array
    if (args.desiredVolumes) {
      requestBody.volumes = {};
      for (const [volumeName, config] of Object.entries(args.desiredVolumes)) {
        requestBody.volumes[volumeName] = {
          name: volumeName
        };
        // Note: size might not be used by the API, but we'll include it if provided
        if (config.size) {
          requestBody.volumes[volumeName].size = config.size;
        }
      }
    }
    
    // Call the declare stack API
    const response = await mittwaldClient.container.declareStack({
      stackId,
      data: requestBody
    });
    
    assertStatus(response, 200);
    
    const result = response.data;
    
    // The API returns 200 even if nothing was created (e.g., due to permissions)
    // We need to verify what was actually created by querying the stack
    
    // Wait a moment for the declaration to be processed
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Query the stack to see what services and volumes actually exist
    let actualServices = 0;
    let actualVolumes = 0;
    
    try {
      // Get stack details to see actual state
      const stackResponse = await mittwaldClient.container.getStack({
        stackId
      });
      
      if (stackResponse.status === 200 && stackResponse.data) {
        actualServices = stackResponse.data.services?.length || 0;
        actualVolumes = stackResponse.data.volumes?.length || 0;
      }
    } catch (queryError) {
      // If we can't query the stack, fall back to requested counts
      console.warn('Could not query stack after declaration:', queryError);
      console.warn('Stack ID:', stackId);
      console.warn('Error details:', queryError instanceof Error ? queryError.message : String(queryError));
      actualServices = Object.keys(requestBody.services || {}).length;
      actualVolumes = Object.keys(requestBody.volumes || {}).length;
    }
    
    // Prepare summary with actual counts
    const summary = {
      stackId,
      services: actualServices,
      volumes: actualVolumes,
      requestedServices: Object.keys(args.desiredServices || {}),
      requestedVolumes: Object.keys(args.desiredVolumes || {}),
      declarationAccepted: true
    };
    
    // Check if what was requested matches what was created
    const requestedServiceCount = Object.keys(args.desiredServices || {}).length;
    const requestedVolumeCount = Object.keys(args.desiredVolumes || {}).length;
    
    if (actualServices < requestedServiceCount || actualVolumes < requestedVolumeCount) {
      // Include warning in the message but use error status for visibility
      return formatToolResponse(
        "error",
        `Stack declaration was accepted by the API but only ${actualServices} of ${requestedServiceCount} services and ${actualVolumes} of ${requestedVolumeCount} volumes were created. This usually indicates permission issues with the stack ID or invalid configuration. Please verify you have access to stack ${stackId}.`,
        summary
      );
    }
    
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