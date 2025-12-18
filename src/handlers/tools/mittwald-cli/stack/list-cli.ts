import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { listStacks, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';

interface MittwaldStackListCliArgs {
  projectId?: string;
  output?: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
  extended?: boolean;
  noHeader?: boolean;
  noTruncate?: boolean;
  noRelativeDates?: boolean;
  csvSeparator?: ',' | ';';
}

type RawStack = {
  id?: string;
  description?: string;
  prefix?: string;
  services?: unknown;
  volumes?: unknown;
  disabled?: boolean;
  projectId?: string;
};

function formatStacks(stacks: RawStack[]) {
  return stacks.map((stack) => ({
    id: stack.id,
    description: stack.description,
    prefix: stack.prefix,
    services: stack.services ?? [],
    volumes: stack.volumes ?? [],
    disabled: stack.disabled ?? false,
    projectId: stack.projectId,
  }));
}

export const handleStackListCli: MittwaldCliToolHandler<MittwaldStackListCliArgs> = async (args, sessionId) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  // Validate required parameters
  if (!args.projectId) {
    return formatToolResponse('error', 'projectId is required');
  }

  try {
    const result = await listStacks({
      apiToken: session.mittwaldAccessToken,
      projectId: args.projectId,
    });

    const stacks = result.data as any[];

    if (!stacks || stacks.length === 0) {
      return formatToolResponse(
        'success',
        'No container stacks found',
        []
      );
    }

    return formatToolResponse(
      'success',
      `Found ${stacks.length} container stack${stacks.length === 1 ? '' : 's'}`,
      formatStacks(stacks)
    );
  } catch (error) {
    if (error instanceof LibraryError) {
      // Provide helpful error messages
      if (error.message.includes('not found') || error.code === 404) {
        return formatToolResponse('error', `Project not found. Please verify the project ID: ${args.projectId}`, {
          code: error.code,
          details: error.details,
        });
      }

      return formatToolResponse('error', error.message, {
        code: error.code,
        details: error.details,
      });
    }

    return formatToolResponse('error', `Failed to list container stacks: ${error instanceof Error ? error.message : String(error)}`);
  }
};
