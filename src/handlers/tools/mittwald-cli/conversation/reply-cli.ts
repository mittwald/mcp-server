import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';

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

function parseConversationReplyOutput(output: string): unknown {
  try {
    const lines = output.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line.startsWith('{') && !line.startsWith('[')) {
        continue;
      }

      let jsonStr = line;
      for (let j = i + 1; j < lines.length; j++) {
        jsonStr += '\n' + lines[j];
        try {
          return JSON.parse(jsonStr);
        } catch {
          // continue collecting lines
        }
      }

      return JSON.parse(jsonStr);
    }

    return JSON.parse(output);
  } catch (error) {
    throw new Error(`Failed to parse JSON output: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function mapCliError(error: CliToolError, args: MittwaldConversationReplyArgs): string {
  const combined = `${error.stdout ?? ''}\n${error.stderr ?? ''}`.toLowerCase();

  if (combined.includes('not found') && combined.includes('conversation')) {
    return `Conversation not found with ID: ${args.conversationId}.\nError: ${error.stderr || error.message}`;
  }

  return error.message;
}

export const handleConversationReplyCli: MittwaldCliToolHandler<MittwaldConversationReplyArgs> = async (args) => {
  const { conversationId, message, messageFrom } = args;

  if (!conversationId) {
    return formatToolResponse('error', 'Conversation ID is required.');
  }

  if (!message && !messageFrom) {
    return formatToolResponse('error', 'No message provided. Please provide either a message or messageFrom parameter.');
  }

  if (!message && messageFrom === '-') {
    return formatToolResponse(
      'error',
      'Reading from stdin is not supported in the MCP context. Please provide the message directly using the message parameter.'
    );
  }

  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_conversation_reply',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout ?? '';
    const stderr = result.result.stderr ?? '';

    try {
      const parsed = parseConversationReplyOutput(stdout);

      if (!isRecord(parsed)) {
        throw new Error('Parsed output is not an object.');
      }

      const data = parsed;
      const messageId = typeof data.messageId === 'string'
        ? data.messageId
        : typeof data.id === 'string'
          ? data.id
          : undefined;

      return formatToolResponse(
        'success',
        `Reply sent to conversation: ${conversationId}`,
        {
          conversationId,
          messageId,
          ...data,
        },
        {
          command: result.meta.command,
          durationMs: result.meta.durationMs,
        }
      );
    } catch (parseError) {
      const normalizedOutput = `${stdout}\n${stderr}`.toLowerCase();

      if (
        normalizedOutput.includes('sent') ||
        normalizedOutput.includes('success') ||
        normalizedOutput.includes('replied')
      ) {
        return formatToolResponse(
          'success',
          `Reply sent to conversation: ${conversationId}`,
          {
            conversationId,
            rawOutput: stdout || stderr,
          },
          {
            command: result.meta.command,
            durationMs: result.meta.durationMs,
          }
        );
      }

      return formatToolResponse(
        'success',
        `Reply operation completed for conversation: ${conversationId}`,
        {
          conversationId,
          rawOutput: stdout || stderr,
          parseError: parseError instanceof Error ? parseError.message : String(parseError),
        },
        {
          command: result.meta.command,
          durationMs: result.meta.durationMs,
        }
      );
    }
  } catch (error) {
    if (error instanceof CliToolError) {
      const message = mapCliError(error, args);
      return formatToolResponse('error', message, {
        exitCode: error.exitCode,
        stderr: error.stderr,
        stdout: error.stdout,
        suggestedAction: error.suggestedAction,
      });
    }

    return formatToolResponse('error', `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`);
  }
};
