import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { replyToConversation, LibraryError } from '@mittwald-mcp/cli-core';
import { validateToolParity } from '../../../../../tests/validation/parallel-validator.js';
import { sessionManager } from '../../../../server/session-manager.js';
import { getCurrentSessionId } from '../../../../utils/execution-context.js';
import { logger } from '../../../../utils/logger.js';

interface MittwaldConversationReplyArgs {
  conversationId: string;
  message?: string;
  messageFrom?: string;
  editor?: string;
}

function buildCliArgs(args: MittwaldConversationReplyArgs): string[] {
  const cliArgs: string[] = ['conversation', 'reply', args.conversationId];

  if (args.message) {
    cliArgs.push('--message', args.message);
  } else if (args.messageFrom) {
    cliArgs.push('--message-from', args.messageFrom);
  }

  if (args.editor) {
    cliArgs.push('--editor', args.editor);
  }

  return cliArgs;
}

export const handleConversationReplyCli: MittwaldCliToolHandler<MittwaldConversationReplyArgs> = async (args, sessionId) => {
  const effectiveSessionId = sessionId || getCurrentSessionId();

  if (!effectiveSessionId) {
    return formatToolResponse('error', 'Session ID required');
  }

  if (!args.conversationId) {
    return formatToolResponse('error', 'conversationId is required');
  }

  if (!args.message && !args.messageFrom) {
    return formatToolResponse('error', 'No message provided. Please provide either a message or messageFrom parameter.');
  }

  if (!args.message && args.messageFrom === '-') {
    return formatToolResponse(
      'error',
      'Reading from stdin is not supported in the MCP context. Please provide the message directly using the message parameter.'
    );
  }

  const session = await sessionManager.getSession(effectiveSessionId);
  if (!session?.mittwaldAccessToken) {
    return formatToolResponse('error', 'No Mittwald access token found in session. Please authenticate first.');
  }

  const argv = buildCliArgs(args);

  try {
    // WP05: Parallel validation - run both CLI and library
    const validation = await validateToolParity({
      toolName: 'mittwald_conversation_reply',
      cliCommand: 'mw',
      cliArgs: [...argv, '--token', session.mittwaldAccessToken],
      libraryFn: async () => {
        return await replyToConversation({
          conversationId: args.conversationId,
          message: args.message!,
          apiToken: session.mittwaldAccessToken,
        });
      },
      ignoreFields: ['durationMs', 'duration', 'timestamp', 'createdAt', 'id', 'messageId'],
    });

    // Log validation results
    if (!validation.passed) {
      logger.warn('[WP05 Validation] Output mismatch detected', {
        tool: 'mittwald_conversation_reply',
        conversationId: args.conversationId,
        discrepancyCount: validation.discrepancies.length,
        discrepancies: validation.discrepancies,
        cliExitCode: validation.cliOutput.exitCode,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
      });
    } else {
      logger.info('[WP05 Validation] 100% parity achieved', {
        tool: 'mittwald_conversation_reply',
        conversationId: args.conversationId,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
        speedup: `${((validation.cliOutput.durationMs / validation.libraryOutput.durationMs) * 100).toFixed(0)}%`,
      });
    }

    // Use library result (it's validated) - data is object
    const result = validation.libraryOutput.data as any;
    const messageId = result?.messageId ?? result?.id;

    return formatToolResponse(
      'success',
      `Reply sent to conversation: ${args.conversationId}`,
      {
        conversationId: args.conversationId,
        messageId,
        ...result,
      },
      {
        durationMs: validation.libraryOutput.durationMs,
        validationPassed: validation.passed,
        discrepancyCount: validation.discrepancies.length,
        cliDuration: validation.cliOutput.durationMs,
        libraryDuration: validation.libraryOutput.durationMs,
      }
    );
  } catch (error) {
    if (error instanceof LibraryError) {
      // Handle special cases
      const message = error.message.toLowerCase();
      if (message.includes('not found') && message.includes('conversation')) {
        return formatToolResponse('error', `Conversation not found with ID: ${args.conversationId}.\nError: ${error.message}`, {
          code: error.code,
          details: error.details,
        });
      }

      return formatToolResponse('error', error.message, {
        code: error.code,
        details: error.details,
      });
    }

    logger.error('[WP05] Unexpected error in conversation reply handler', { error });
    return formatToolResponse('error', `Failed to reply to conversation: ${error instanceof Error ? error.message : String(error)}`);
  }
};
