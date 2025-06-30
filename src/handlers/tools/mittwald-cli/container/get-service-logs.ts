import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { assertStatus } from '@mittwald/api-client-commons';

interface GetServiceLogsArgs {
  stackId: string;
  serviceId: string;
  since?: string;
  until?: string;
  limit?: number;
  follow?: boolean;
}

export const handleContainerGetServiceLogs: MittwaldToolHandler<GetServiceLogsArgs> = async (args, { mittwaldClient }) => {
  try {
    if (args.follow) {
      return formatToolResponse(
        "error",
        "Following logs is not supported in MCP context. Remove the 'follow' parameter to get a snapshot of logs."
      );
    }
    
    const queryParams: any = {};
    
    if (args.since) {
      queryParams.since = args.since;
    }
    
    if (args.until) {
      queryParams.until = args.until;
    }
    
    if (args.limit) {
      queryParams.limit = args.limit;
    }
    
    const response = await mittwaldClient.container.getServiceLogs({
      stackId: args.stackId,
      serviceId: args.serviceId,
      ...queryParams
    });
    
    assertStatus(response, 200);
    
    const logs = response.data;
    
    // The API returns logs as a string
    if (!logs || typeof logs !== 'string' || logs.trim() === '') {
      return formatToolResponse("success", "No logs found for the specified time range");
    }
    
    return formatToolResponse(
      "success",
      logs,
      {
        stackId: args.stackId,
        serviceId: args.serviceId,
        timeRange: {
          since: args.since || 'beginning',
          until: args.until || 'now'
        }
      }
    );
    
  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to get service logs: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};