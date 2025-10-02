import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';

interface MittwaldConversationListArgs {
  output?: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
  extended?: boolean;
  noHeader?: boolean;
  noTruncate?: boolean;
  noRelativeDates?: boolean;
  csvSeparator?: ',' | ';';
}

interface RawConversation {
  id?: string;
  title?: string;
  status?: string;
  category?: string;
  createdAt?: string;
  updatedAt?: string;
  lastMessage?: unknown;
}

function buildCliArgs(args: MittwaldConversationListArgs): string[] {
  const cliArgs: string[] = ['conversation', 'list', '--output', 'json'];

  if (args.extended) cliArgs.push('--extended');
  if (args.noHeader) cliArgs.push('--no-header');
  if (args.noTruncate) cliArgs.push('--no-truncate');
  if (args.noRelativeDates) cliArgs.push('--no-relative-dates');
  if (args.csvSeparator) cliArgs.push('--csv-separator', args.csvSeparator);

  return cliArgs;
}

function parseConversations(output: string): RawConversation[] | undefined {
  if (!output) return [];

  try {
    const parsed = JSON.parse(output);
    return Array.isArray(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

function formatConversations(conversations: RawConversation[]) {
  return conversations.map((item) => ({
    id: item.id,
    title: item.title,
    status: item.status,
    category: item.category,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    lastMessage: item.lastMessage,
  }));
}

export const handleConversationListCli: MittwaldCliToolHandler<MittwaldConversationListArgs> = async (args) => {
  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_conversation_list',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout ?? '';
    const parsed = parseConversations(stdout.trim());

    if (!parsed) {
      return formatToolResponse(
        'success',
        'Conversations retrieved (raw output)',
        {
          rawOutput: stdout,
        },
        {
          command: result.meta.command,
          durationMs: result.meta.durationMs,
        }
      );
    }

    if (parsed.length === 0) {
      return formatToolResponse(
        'success',
        'No conversations found',
        [],
        {
          command: result.meta.command,
          durationMs: result.meta.durationMs,
        }
      );
    }

    const formatted = formatConversations(parsed);

    return formatToolResponse(
      'success',
      `Found ${formatted.length} conversation(s)`,
      formatted,
      {
        command: result.meta.command,
        durationMs: result.meta.durationMs,
      }
    );
  } catch (error) {
    if (error instanceof CliToolError) {
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
