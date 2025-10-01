import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';

interface MittwaldConversationCloseArgs {
  conversationId: string;
}

function buildCliArgs(args: MittwaldConversationCloseArgs): string[] {
  return ['conversation', 'close', args.conversationId];
}

function parseCloseOutput(output: string): Record<string, unknown> | undefined {
  if (!output) return {};

  try {
    const parsed = JSON.parse(output);
    return typeof parsed === 'object' && parsed !== null ? parsed as Record<string, unknown> : {};
  } catch {
    return undefined;
  }
}

function isAlreadyClosedMessage(message: string): boolean {
  return message.toLowerCase().includes('already closed');
}

function isConversationNotFound(message: string): boolean {
  const lower = message.toLowerCase();
  return lower.includes('not found') && lower.includes('conversation');
}

export const handleConversationCloseCli: MittwaldCliToolHandler<MittwaldConversationCloseArgs> = async (args) => {
  const { conversationId } = args;
  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_conversation_close',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout ?? '';
    const parsed = parseCloseOutput(stdout.trim());

    if (parsed === undefined) {
      const normalized = stdout.toLowerCase();
      if (normalized.includes('closed') || normalized.includes('success')) {
        return formatToolResponse(
          'success',
          `Conversation closed successfully: ${conversationId}`,
          {
            conversationId,
            status: 'closed',
            rawOutput: stdout,
          },
          {
            command: result.meta.command,
            durationMs: result.meta.durationMs,
          }
        );
      }

      return formatToolResponse(
        'success',
        `Close operation completed for conversation: ${conversationId}`,
        {
          conversationId,
          rawOutput: stdout,
        },
        {
          command: result.meta.command,
          durationMs: result.meta.durationMs,
        }
      );
    }

    return formatToolResponse(
      'success',
      `Conversation closed successfully: ${conversationId}`,
      {
        conversationId,
        status: 'closed',
        ...parsed,
      },
      {
        command: result.meta.command,
        durationMs: result.meta.durationMs,
      }
    );
  } catch (error) {
    if (error instanceof CliToolError) {
      const combined = `${error.stdout ?? ''}\n${error.stderr ?? ''}`.trim();

      if (isConversationNotFound(combined || error.message)) {
        return formatToolResponse(
          'error',
          `Conversation not found with ID: ${conversationId}.\nError: ${combined || error.message}`,
          {
            exitCode: error.exitCode,
            stderr: error.stderr,
            stdout: error.stdout,
            suggestedAction: error.suggestedAction,
          }
        );
      }

      if (isAlreadyClosedMessage(combined || error.message)) {
        return formatToolResponse(
          'success',
          `Conversation ${conversationId} is already closed`,
          {
            conversationId,
            status: 'already_closed',
            output: combined || undefined,
          },
          error.command
            ? {
                command: error.command,
                durationMs: undefined,
              }
            : undefined
        );
      }

      return formatToolResponse('error', error.message, {
        exitCode: error.exitCode,
        stderr: error.stderr,
        stdout: error.stdout,
        suggestedAction: error.suggestedAction,
      });
    }

    return formatToolResponse(
      'error',
      `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
