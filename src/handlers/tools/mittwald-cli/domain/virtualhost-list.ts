import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { MittwaldAPIV2 } from '@mittwald/api-client';
import { Simplify } from '@mittwald/api-client-commons';

type ResponseItem = Simplify<
  MittwaldAPIV2.Paths.V2Ingresses.Get.Responses.$200.Content.ApplicationJson[number]
>;

interface MittwaldDomainVirtualhostListArgs {
  projectId?: string;
  all?: boolean;
  output?: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
  extended?: boolean;
  noHeader?: boolean;
  noTruncate?: boolean;
  noRelativeDates?: boolean;
  csvSeparator?: ',' | ';';
}

export const handleDomainVirtualhostList: MittwaldToolHandler<MittwaldDomainVirtualhostListArgs> = async (args, { mittwaldClient }) => {
  try {
    // Fetch ingresses (virtual hosts)
    const response = args.all
      ? await mittwaldClient.api.domain.ingressListIngresses({})
      : await mittwaldClient.api.domain.ingressListIngresses({
          queryParameters: { projectId: args.projectId },
        });

    const data = response.data as ResponseItem[];
    
    if (!data || data.length === 0) {
      return formatToolResponse(
        "success",
        "No virtual hosts found",
        []
      );
    }

    // Format the data based on output format
    const formatItem = (item: ResponseItem) => {
      const baseData = {
        id: item.id,
        hostname: `https://${item.hostname}`,
        paths: item.paths.map((p) => {
          if ('directory' in p.target) {
            return `${p.path} → directory (${p.target.directory})`;
          }
          if ('url' in p.target) {
            return `${p.path} → url (${p.target.url})`;
          }
          if ('installationId' in p.target) {
            return `${p.path} → app (${p.target.installationId})`;
          }
          return `${p.path} → default`;
        }),
        status: item.dnsValidationErrors.length === 0 ? 'ready' : `${item.dnsValidationErrors.length} issues`,
        ips: item.ips.v4.join(', '),
      };

      if (args.all || args.extended) {
        return {
          ...baseData,
          projectId: item.projectId,
        };
      }

      return baseData;
    };

    const formattedData = data.map(formatItem);

    // Handle different output formats
    if (args.output === 'json') {
      return formatToolResponse(
        "success",
        "Virtual hosts retrieved successfully",
        formattedData
      );
    }

    // For other formats, we'll return structured data that can be formatted by the client
    return formatToolResponse(
      "success",
      `Found ${data.length} virtual host(s)`,
      formattedData
    );

  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to list virtual hosts: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};