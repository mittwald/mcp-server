import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';

interface MittwaldDomainVirtualhostCreateArgs {
  hostname: string;
  projectId?: string;
  quiet?: boolean;
  pathToApp?: string[];
  pathToUrl?: string[];
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
            `Invalid path-to-app format: ${pathMapping}. Expected format: path:appId`
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

    // If no paths specified, we need at least one path mapping
    if (paths.length === 0) {
      return formatToolResponse(
        "error",
        "At least one path mapping (pathToApp or pathToUrl) must be specified"
      );
    }

    // Create the ingress using the correct API method
    const createRequest: any = {
      hostname: args.hostname,
      paths
    };
    
    if (args.projectId) {
      createRequest.projectId = args.projectId;
    }

    const response = await mittwaldClient.api.domain.ingressCreateIngress({
      data: createRequest,
    });

    const ingressId = response.data?.id;
    
    if (!ingressId) {
      return formatToolResponse(
        "error",
        "Failed to create ingress: No ID returned"
      );
    }

    const resultData = {
      id: ingressId,
      hostname: args.hostname,
      paths: paths.map(p => ({
        path: p.path,
        target: 'installationId' in p.target ? `app:${p.target.installationId}` :
                'url' in p.target ? `url:${p.target.url}` :
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
    return formatToolResponse(
      "error",
      `Failed to create virtual host: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};