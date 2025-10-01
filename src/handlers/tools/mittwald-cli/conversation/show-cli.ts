import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';

interface MittwaldConversationShowArgs {
  conversationId: string;
}

function buildCliArgs(args: MittwaldConversationShowArgs): string[] {
  return ['conversation', 'show', args.conversationId];
}

function parseConversationShowOutput(output: string): unknown {
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

function mapCliError(error: CliToolError, args: MittwaldConversationShowArgs): string {
  const combined = `${error.stdout ?? ''}\n${error.stderr ?? ''}`.toLowerCase();

  if (combined.includes('not found') && combined.includes('conversation')) {
    return `Conversation not found with ID: ${args.conversationId}.\nError: ${error.stderr || error.message}`;
  }

  return error.message;
}

export const handleConversationShowCli: MittwaldCliToolHandler<MittwaldConversationShowArgs> = async (args) => {
  const { conversationId } = args;

  if (!conversationId) {
    return formatToolResponse('error', 'Conversation ID is required.');
  }

  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_conversation_show',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout ?? '';
    const stderr = result.result.stderr ?? '';

    try {
      const parsed = parseConversationShowOutput(stdout);

      if (!isRecord(parsed)) {
        throw new Error('Parsed output is not an object.');
      }

      return formatToolResponse(
        'success',
        `Retrieved conversation: ${conversationId}`,
        {
          conversationId,
          ...parsed,
        },
        {
          command: result.meta.command,
          durationMs: result.meta.durationMs,
        }
      );
    } catch (parseError) {
      return formatToolResponse(
        'success',
        `Conversation details for: ${conversationId}`,
        {
          conversationId,
          content: stdout || stderr,
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
