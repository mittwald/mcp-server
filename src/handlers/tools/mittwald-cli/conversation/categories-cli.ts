import type { MittwaldCliToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { invokeCliTool, CliToolError } from '../../../../tools/index.js';

interface MittwaldConversationCategoriesArgs {
  output?: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
  extended?: boolean;
  noHeader?: boolean;
  noTruncate?: boolean;
  noRelativeDates?: boolean;
  csvSeparator?: ',' | ';';
}

interface RawConversationCategory {
  id?: string;
  categoryId?: string;
  name?: string;
  description?: string;
  isActive?: boolean;
  sortOrder?: number;
}

function buildCliArgs(args: MittwaldConversationCategoriesArgs): string[] {
  const cliArgs: string[] = ['conversation', 'categories', '--output', 'json'];

  if (args.extended) cliArgs.push('--extended');
  if (args.noHeader) cliArgs.push('--no-header');
  if (args.noTruncate) cliArgs.push('--no-truncate');
  if (args.noRelativeDates) cliArgs.push('--no-relative-dates');
  if (args.csvSeparator) cliArgs.push('--csv-separator', args.csvSeparator);

  return cliArgs;
}

function parseCategories(output: string): RawConversationCategory[] | undefined {
  if (!output) return [];

  try {
    const parsed = JSON.parse(output);
    return Array.isArray(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
}

function formatCategories(categories: RawConversationCategory[]) {
  return categories.map((item) => ({
    id: item.id ?? item.categoryId,
    name: item.name,
    description: item.description,
    isActive: item.isActive,
    sortOrder: item.sortOrder,
  }));
}

export const handleConversationCategoriesCli: MittwaldCliToolHandler<MittwaldConversationCategoriesArgs> = async (args) => {
  const argv = buildCliArgs(args);

  try {
    const result = await invokeCliTool({
      toolName: 'mittwald_conversation_categories',
      argv,
      parser: (stdout, raw) => ({ stdout, stderr: raw.stderr }),
    });

    const stdout = result.result.stdout ?? '';
    const parsed = parseCategories(stdout.trim());

    if (!parsed) {
      return formatToolResponse(
        'success',
        'Conversation categories retrieved (raw output)',
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
        'No conversation categories found',
        [],
        {
          command: result.meta.command,
          durationMs: result.meta.durationMs,
        }
      );
    }

    const formatted = formatCategories(parsed);

    return formatToolResponse(
      'success',
      `Found ${formatted.length} conversation category(ies)`,
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
