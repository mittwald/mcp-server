import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { assertStatus } from '@mittwald/api-client-commons';

interface CreateRegistryArgs {
  projectId: string;
  uri: string;
  imageRegistryType?: 'docker' | 'github' | 'gitlab' | 'custom';
  username?: string;
  password?: string;
}

export const handleContainerCreateRegistry: MittwaldToolHandler<CreateRegistryArgs> = async (args, { mittwaldClient }) => {
  try {
    // Validate registry type and URI
    const registryType = args.imageRegistryType || 'custom';
    
    // Common registry URIs
    const knownRegistries: Record<string, string> = {
      'docker': 'docker.io',
      'github': 'ghcr.io',
      'gitlab': 'registry.gitlab.com'
    };
    
    // If type is specified but URI doesn't match, warn user
    if (registryType !== 'custom' && knownRegistries[registryType] && !args.uri.includes(knownRegistries[registryType])) {
      return formatToolResponse(
        "error",
        `Registry type '${registryType}' typically uses URI '${knownRegistries[registryType]}', but you provided '${args.uri}'. Please check your configuration.`
      );
    }
    
    const requestBody: any = {
      imageRegistryType: registryType,
      uri: args.uri
    };
    
    // Add credentials if provided
    if (args.username || args.password) {
      if (!args.username || !args.password) {
        return formatToolResponse(
          "error",
          "Both username and password are required for authenticated registries"
        );
      }
      
      requestBody.credentials = {
        username: args.username,
        password: args.password,
        passwordVersion: 1 // Required for password updates
      };
    }
    
    const response = await mittwaldClient.container.createRegistry({
      projectId: args.projectId,
      data: requestBody
    });
    
    assertStatus(response, 201);
    
    const registry = response.data;
    
    return formatToolResponse(
      "success",
      `Container registry created successfully`,
      {
        id: registry.id,
        uri: registry.uri,
        type: registryType,
        username: args.username || 'anonymous',
        projectId: args.projectId
      }
    );
    
  } catch (error) {
    // Handle specific error cases
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    if (errorMessage.includes('already exists')) {
      return formatToolResponse(
        "error",
        `A registry with URI '${args.uri}' already exists in this project`
      );
    }
    
    if (errorMessage.includes('invalid uri')) {
      return formatToolResponse(
        "error",
        `Invalid registry URI: '${args.uri}'. Please provide a valid registry hostname.`
      );
    }
    
    return formatToolResponse(
      "error",
      `Failed to create container registry: ${errorMessage}`
    );
  }
};