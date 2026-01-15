import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';
import { logger } from '../../../../utils/logger.js';

interface MittwaldConversationCloseArgs {
  conversationId: string;
}

function buildCliArgs(args: MittwaldConversationCloseArgs): string[] {
  return ['conversation', 'close', args.conversationId];
}

export const handleConversationCloseCli: MittwaldCliToolHandler<MittwaldConversationCloseArgs> = async (args, sessionId) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  if (!args.conversationId) {
    return formatToolResponse('error', 'conversationId is required');
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_conversation_close',
      argv: [...argv, '--token', session.mittwaldAccessToken],
      parser: (stdout, raw) => ({ success: true, stdout, stderr: raw.stderr }),
    });

    return formatToolResponse(
      'success',
      `Conversation closed successfully: ${args.conversationId}`,
      {
        conversationId: args.conversationId,
        status: 'closed',
      }
    );
  } catch (error) {
    if (error instanceof CliToolError) {
      const message = error.message.toLowerCase();
      if (message.includes('not found') && message.includes('conversation')) {
        return formatToolResponse('error', `Conversation not found with ID: ${args.conversationId}.\nError: ${error.message}`, {
          exitCode: error.exitCode,
          stderr: error.stderr,
        });
      }
      if (message.includes('already closed')) {
        return formatToolResponse(
          'success',
          `Conversation ${args.conversationId} is already closed`,
          {
            conversationId: args.conversationId,
            status: 'already_closed',
          }
        );
      }

      return formatToolResponse('error', error.message, {
        exitCode: error.exitCode,
        stderr: error.stderr,
        stdout: error.stdout,
        suggestedAction: error.suggestedAction,
      });
    }

    logger.error('Unexpected error in conversation close handler', { error });
    return formatToolResponse('error', `Failed to close conversation: ${error instanceof Error ? error.message : String(error)}`);
  }
};
