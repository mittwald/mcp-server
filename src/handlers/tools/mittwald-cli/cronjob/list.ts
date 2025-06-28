import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { formatToolResponse } from '@/utils/format-tool-response.js';
import { executeCliCommand } from '@/utils/execute-cli-command.js';

export async function handleMittwaldCronjobList(
  projectId?: string,
  output: string = 'json',
  extended?: boolean,
  noHeader?: boolean,
  noTruncate?: boolean,
  noRelativeDates?: boolean,
  csvSeparator: string = ','
): Promise<CallToolResult> {
  try {
    const args = [
      'cronjob',
      'list',
      '-o',
      output
    ];

    if (projectId) {
      args.push('-p', projectId);
    }

    if (extended) {
      args.push('-x');
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

    if (csvSeparator !== ',') {
      args.push('--csv-separator', csvSeparator);
    }

    const result = await executeCliCommand('mw', args);

    return formatToolResponse('success', 'Cronjobs listed successfully', result);
  } catch (error) {
    return formatToolResponse('error', `Error listing cron jobs: ${error instanceof Error ? error.message : String(error)}`);
  }
}