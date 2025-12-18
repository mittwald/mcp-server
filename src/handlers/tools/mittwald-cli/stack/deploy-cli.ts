import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { deployStack, LibraryError } from '@mittwald-mcp/cli-core';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';

interface MittwaldStackDeployCliArgs {
  stackId?: string;
  quiet?: boolean;
  composeFile?: string;
  envFile?: string;
  recreate?: boolean;
}

export const handleStackDeployCli: MittwaldCliToolHandler<MittwaldStackDeployCliArgs> = async (args, sessionId) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  if (!args.stackId) {
    return formatToolResponse('error', 'Stack ID is required. Please provide the stackId parameter.');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  try {
    const deployData = await deployStack({
      stackId: args.stackId,
      recreate: args.recreate ?? true,
      apiToken: session.mittwaldAccessToken,
    });

    return formatToolResponse(
      'success',
      'Stack deployment completed',
      {
        stackId: args.stackId,
        status: 'deployed',
        composeFile: args.composeFile,
        envFile: args.envFile,
        recreate: args.recreate ?? true,
        result: deployData,
      }
    );
  } catch (error) {
    if (error instanceof LibraryError) {
      return formatToolResponse('error', error.message, {
        code: error.code,
        details: error.details,
      });
    }

    return formatToolResponse('error', `Failed to deploy stack: ${error instanceof Error ? error.message : String(error)}`);
  }
};
