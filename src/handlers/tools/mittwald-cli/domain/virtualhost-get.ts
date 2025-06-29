import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';

interface MittwaldDomainVirtualhostGetArgs {
  ingressId: string;
  output: 'txt' | 'json' | 'yaml';
}

export const handleDomainVirtualhostGet: MittwaldToolHandler<MittwaldDomainVirtualhostGetArgs> = async (args, { mittwaldClient }) => {
  try {
    // Get the specific ingress
    const response = await mittwaldClient.api.domain.ingressGetIngress({
      ingressId: args.ingressId,
    });

    const data = response.data as any;
    
    if (!data) {
      return formatToolResponse(
        "error",
        `Virtual host with ID ${args.ingressId} not found`
      );
    }

    // Format the data
    const formattedData = {
      id: data.id,
      hostname: data.hostname,
      projectId: data.projectId,
      paths: (data.paths || []).map((p: any) => {
        if ('directory' in p.target) {
          return {
            path: p.path,
            target: `directory:${p.target.directory}`
          };
        }
        if ('url' in p.target) {
          return {
            path: p.path,
            target: `url:${p.target.url}`
          };
        }
        if ('installationId' in p.target) {
          return {
            path: p.path,
            target: `app:${p.target.installationId}`
          };
        }
        return {
          path: p.path,
          target: 'unknown'
        };
      }),
      ips: {
        v4: (data.ips as any)?.v4 || [],
      },
      dnsValidationErrors: data.dnsValidationErrors,
    };

    return formatToolResponse(
      "success",
      `Virtual host '${data.hostname}' retrieved successfully`,
      formattedData
    );

  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to get virtual host: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};