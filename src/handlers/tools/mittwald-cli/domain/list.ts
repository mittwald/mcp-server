import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';

interface MittwaldDomainListArgs {
  projectId?: string;
  output: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
  extended?: boolean;
  noHeader?: boolean;
  noTruncate?: boolean;
  noRelativeDates?: boolean;
  csvSeparator?: ',' | ';';
}

export const handleDomainList: MittwaldToolHandler<MittwaldDomainListArgs> = async (args, { mittwaldClient }) => {
  try {
    // Fetch domains for the project using the correct API method
    const response = await mittwaldClient.api.domain.listDomains({
      queryParameters: args.projectId ? { projectId: args.projectId } : {},
    });

    const data = response.data;
    
    if (!data || data.length === 0) {
      return formatToolResponse(
        "success",
        "No domains found",
        []
      );
    }

    // Format the data based on output format
    const formatItem = (item: any) => {
      const baseData = {
        domain: item.domain,
        connected: item.connected,
        deleted: item.deleted,
        nameservers: item.nameservers,
        usesDefaultNameserver: item.usesDefaultNameserver,
        ...(args.extended && {
          projectId: item.projectId,
          contactHash: item.contactHash,
          authCode: item.authCode,
        }),
      };

      return baseData;
    };

    const formattedData = data.map(formatItem);

    // Handle different output formats
    if (args.output === 'json') {
      return formatToolResponse(
        "success",
        "Domains retrieved successfully",
        formattedData
      );
    }

    // For other formats, we'll return structured data that can be formatted by the client
    return formatToolResponse(
      "success",
      `Found ${data.length} domain(s)`,
      formattedData
    );

  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to list domains: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};