import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { detectIdMixup } from '../../../../utils/context-validator.js';

interface MittwaldDomainVirtualhostCreateArgs {
  hostname: string;
  projectId?: string;
  quiet?: boolean;
  pathToApp?: string[];
  pathToUrl?: string[];
  pathToContainer?: string[];
}

export const handleDomainVirtualhostCreate: MittwaldToolHandler<MittwaldDomainVirtualhostCreateArgs> = async (args, { mittwaldClient }) => {
  try {
    // Parse path mappings
    const paths: any[] = [];
    
    // Process pathToApp mappings
    if (args.pathToApp) {
      for (const pathMapping of args.pathToApp) {
        const [path, appId] = pathMapping.split(':', 2);
        if (!path || !appId) {
          return formatToolResponse(
            "error",
            `Invalid path-to-app format: ${pathMapping}. Expected format: path:appId (e.g., '/:a-123456')`
          );
        }
        
        // Validate app ID format
        if (!appId.match(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/) && !appId.match(/^a-[a-z0-9]{6}$/)) {
          return formatToolResponse(
            "error",
            `Invalid app ID format: ${appId}. App IDs should be either a UUID (e.g., '3ecaf1a9-6eb4-4869-b811-8a13c3a2e745') or a short ID starting with 'a-' (e.g., 'a-3c96b5'). Note: Container service IDs start with 'c-', not 'a-'.`
          );
        }
        
        paths.push({
          path,
          target: {
            installationId: appId
          }
        });
      }
    }
    
    // Process pathToUrl mappings
    if (args.pathToUrl) {
      for (const pathMapping of args.pathToUrl) {
        const [path, url] = pathMapping.split(':', 2);
        if (!path || !url) {
          return formatToolResponse(
            "error",
            `Invalid path-to-url format: ${pathMapping}. Expected format: path:url`
          );
        }
        paths.push({
          path,
          target: {
            url
          }
        });
      }
    }

    // Process pathToContainer mappings
    if (args.pathToContainer) {
      for (const pathMapping of args.pathToContainer) {
        const parts = pathMapping.split(':');
        if (parts.length !== 3) {
          return formatToolResponse(
            "error",
            `Invalid path-to-container format: ${pathMapping}. Expected format: path:containerId:port (e.g., '/:c-f6kw84:5601/tcp')`
          );
        }
        
        const [path, containerId, port] = parts;
        
        // Validate container ID format
        if (!containerId.match(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/) && !containerId.match(/^c-[a-z0-9]{6}$/)) {
          return formatToolResponse(
            "error",
            `Invalid container ID format: ${containerId}. Container IDs should be either a UUID or a short ID starting with 'c-' (e.g., 'c-f6kw84').`
          );
        }
        
        // Validate port format
        if (!port.match(/^\d+\/(tcp|udp)$/)) {
          return formatToolResponse(
            "error",
            `Invalid port format: ${port}. Expected format: port/protocol (e.g., '5601/tcp', '8080/tcp')`
          );
        }
        
        paths.push({
          path,
          target: {
            container: {
              id: containerId,
              portProtocol: port
            }
          }
        });
      }
    }

    // If no paths specified, we need at least one path mapping
    if (paths.length === 0) {
      return formatToolResponse(
        "error",
        "At least one path mapping (pathToApp, pathToUrl, or pathToContainer) must be specified"
      );
    }

    // Create the ingress using the correct API method
    const createRequest: any = {
      hostname: args.hostname,
      paths
    };
    
    if (args.projectId) {
      // Basic format validation for project ID
      if (!args.projectId.match(/^p-[a-z0-9]{6}$/)) {
        const mixupSuggestions = detectIdMixup(args.projectId);
        return formatToolResponse(
          "error",
          `Invalid project ID format: ${args.projectId}`,
          {
            providedId: args.projectId,
            expectedFormat: "p-XXXXXX (e.g., p-cz3ys3)",
            suggestions: mixupSuggestions,
            hint: "Project IDs start with 'p-' followed by 6 alphanumeric characters"
          }
        );
      }

      createRequest.projectId = args.projectId;
    }

    let response;
    try {
      response = await mittwaldClient.domain.ingressCreateIngress({
        data: createRequest,
      });
      
      // Debug: Log the actual response structure (avoid circular references)
      console.log('API Response Status:', response.status);
      console.log('API Response Data:', response.data);
    } catch (apiError) {
      console.log('API call failed:', apiError instanceof Error ? apiError.message : 'Unknown API error');
      return formatToolResponse(
        "error",
        `API call failed: ${apiError instanceof Error ? apiError.message : 'Unknown API error'}`
      );
    }

    // Check status code first (like other handlers do)
    if (response.status !== 201) {
      return formatToolResponse(
        "error",
        `Failed to create ingress: HTTP ${response.status}. Data: ${JSON.stringify(response.data)}`
      );
    }

    const ingressId = response.data?.id;
    
    if (!ingressId) {
      return formatToolResponse(
        "error",
        `Failed to create ingress: No ID returned. Status: ${response.status}, Data: ${JSON.stringify(response.data)}`
      );
    }

    const resultData = {
      id: ingressId,
      hostname: args.hostname,
      paths: paths.map(p => ({
        path: p.path,
        target: 'installationId' in p.target ? `app:${p.target.installationId}` :
                'url' in p.target ? `url:${p.target.url}` :
                'container' in p.target ? `container:${p.target.container.id}:${p.target.container.portProtocol}` :
                'directory' in p.target ? `dir:${p.target.directory}` : 'unknown'
      }))
    };

    return formatToolResponse(
      "success",
      args.quiet ? 
        `Ingress created: ${ingressId}` :
        `Successfully created virtual host '${args.hostname}' with ID ${ingressId}`,
      resultData
    );

  } catch (error) {
    console.log('Error during virtual host creation:', error instanceof Error ? error.message : 'Unknown error');
    
    // Handle potential circular reference errors
    let errorMessage = 'Unknown error occurred';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else {
      // Avoid circular reference issues by extracting key properties
      if (error && typeof error === 'object') {
        errorMessage = `Error object: ${error.constructor?.name || 'Unknown'}`;
        if ('message' in error) {
          errorMessage += ` - ${error.message}`;
        }
        if ('status' in error) {
          errorMessage += ` (HTTP ${error.status})`;
        }
      } else {
        errorMessage = 'Complex error object (cannot serialize)';
      }
    }
    
    return formatToolResponse(
      "error",
      `Failed to create virtual host: ${errorMessage}`
    );
  }
};