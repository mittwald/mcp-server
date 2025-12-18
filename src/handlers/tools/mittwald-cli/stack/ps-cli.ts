import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { getStackProcesses, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';

interface MittwaldStackPsCliArgs {
  stackId?: string;
  projectId?: string;
  output?: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
  extended?: boolean;
  noHeader?: boolean;
  noTruncate?: boolean;
  noRelativeDates?: boolean;
  csvSeparator?: ',' | ';';
}

type RawService = {
  id?: string;
  name?: string;
  state?: string;
  image?: string;
  ports?: unknown;
  stackId?: string;
  createdAt?: string;
  updatedAt?: string;
};

function formatServices(services: RawService[]) {
  return services.map((service) => ({
    id: service.id,
    name: service.name,
    state: service.state,
    image: service.image,
    ports: service.ports ?? [],
    stackId: service.stackId,
    createdAt: service.createdAt,
    updatedAt: service.updatedAt,
  }));
}

export const handleStackPsCli: MittwaldCliToolHandler<MittwaldStackPsCliArgs> = async (args, sessionId) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  if (!args.stackId) {
    return formatToolResponse('error', 'Stack ID is required. Please provide the stackId parameter.');
  }

  if (!args.projectId) {
    return formatToolResponse('error', 'Project ID is required. Please provide the projectId parameter.');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  try {
    const services = (await getStackProcesses({
      stackId: args.stackId,
      projectId: args.projectId,
      apiToken: session.mittwaldAccessToken,
    })) as RawService[];

    if (!services || services.length === 0) {
      return formatToolResponse(
        'success',
        'No services found in the stack',
        []
      );
    }

    return formatToolResponse(
      'success',
      `Found ${services.length} service${services.length === 1 ? '' : 's'} in the stack`,
      formatServices(services)
    );
  } catch (error) {
    if (error instanceof LibraryError) {
      return formatToolResponse('error', error.message, {
        code: error.code,
        details: error.details,
      });
    }

    return formatToolResponse('error', `Failed to get stack processes: ${error instanceof Error ? error.message : String(error)}`);
  }
};
