import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { formatToolResponse } from '@/utils/format-tool-response.js';
import { executeCommand } from '@/utils/executeCommand.js';

export async function handleMittwaldDatabaseMysqlCharsets(
  output: string = 'json',
  extended?: boolean,
  noHeader?: boolean,
  noTruncate?: boolean,
  noRelativeDates?: boolean,
  csvSeparator?: string
): Promise<CallToolResult> {
  try {
    const args = ['database', 'mysql', 'charsets'];

    args.push('--output', output);

    if (extended) {
      args.push('--extended');
    }

    if (noHeader) {
      args.push('--no-header');
    }

    if (noTruncate) {
      args.push('--no-truncate');
    }

    if (noRelativeDates) {
      args.push('--no-relative-dates');
    }

    if (csvSeparator) {
      args.push('--csv-separator', csvSeparator);
    }

    const result = await executeCommand(`mw ${args.join(' ')}`);

    return formatToolResponse('success', 'MySQL character sets retrieved successfully', result);
  } catch (error) {
    return formatToolResponse('error', `Error listing MySQL character sets: ${error instanceof Error ? error.message : String(error)}`);
  }
}