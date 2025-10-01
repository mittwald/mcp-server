import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';
import { parseJsonOutput } from '../../../../utils/cli-wrapper.js';

interface MittwaldConversationCreateArgs {
  title: string;
  message?: string;
  messageFrom?: string;
  editor?: string;
  category?: string;
}

function buildCliArgs(args: MittwaldConversationCreateArgs): string[] {
  const cliArgs: string[] = ['conversation', 'create', '--title', args.title];

  if (args.category) cliArgs.push('--category', args.category);

  if (args.message) {
    cliArgs.push('--message', args.message);
  } else if (args.messageFrom) {
    cliArgs.push('--message-from', args.messageFrom);
  }

  if (args.editor) cliArgs.push('--editor', args.editor);

  return cliArgs;
}

type ParsedConversationOutput = {
  ok: true;
  data: Record<string, unknown>;
} | {
  ok: false;
  error: string;
}

function parseConversationOutput(stdout: string): ParsedConversationOutput {
  if (!stdout) {
    return { ok: true, data: {} };
  }

  try {
    const parsed = parseJsonOutput(stdout);
    if (typeof parsed === 'object' && parsed !== null) {
      return { ok: true, data: parsed as Record<string, unknown> };
    }
    return { ok: true, data: {} };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, error: message };
  }
}

function mapCliError(error: CliToolError, category?: string): string {
  const combined = `${error.stdout ?? ''}\n${error.stderr ?? ''}`.toLowerCase();

  if (combined.includes('category') && combined.includes('not found')) {
    return `Category not found: ${category}. Use conversation categories command to list available categories.\nError: ${error.stderr || error.stdout || error.message}`;
  }

  return error.message;
}

export const handleConversationCreateCli: MittwaldCliToolHandler<MittwaldConversationCreateArgs> = async (args) => {
  const { title, message, messageFrom, category } = args;

  if (!message) {
    if (!messageFrom) {
      return formatToolResponse('error', 'No message provided. Please provide either a message or messageFrom parameter.');
    }

    if (messageFrom === '-') {
      return formatToolResponse(
        'error',
        'Reading from stdin is not supported in the MCP context. Please provide the message directly using the message parameter.'
      );
    }
  }

  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_conversation_create',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout ?? '';
    const parsed = parseConversationOutput(stdout.trim());

    if (!parsed.ok) {
      const normalized = stdout.toLowerCase();
      if (normalized.includes('created') || normalized.includes('success')) {
        return formatToolResponse(
          'success',
          'Conversation created successfully',
          {
            title,
            category,
            rawOutput: stdout,
            parseError: parsed.error,
          },
          {
            command: result.meta.command,
            durationMs: result.meta.durationMs,
          }
        );
      }

      return formatToolResponse(
        'success',
        'Conversation creation completed (raw output)',
        {
          rawOutput: stdout,
          parseError: parsed.error,
        },
        {
          command: result.meta.command,
          durationMs: result.meta.durationMs,
        }
      );
    }

    const conversationId = parsed.data.conversationId ?? parsed.data.id;

    return formatToolResponse(
      'success',
      'Conversation created successfully',
      {
        conversationId,
        title,
        category,
        ...parsed.data,
      },
      {
        command: result.meta.command,
        durationMs: result.meta.durationMs,
      }
    );
  } catch (error) {
    if (error instanceof CliToolError) {
      const messageText = mapCliError(error, category);
      return formatToolResponse('error', messageText, {
        exitCode: error.exitCode,
        stderr: error.stderr,
        stdout: error.stdout,
        suggestedAction: error.suggestedAction,
      });
    }

    return formatToolResponse('error', `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`);
  }
};
