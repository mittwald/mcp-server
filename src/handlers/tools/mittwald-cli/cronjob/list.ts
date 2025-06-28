import type { ToolResponse } from '@/utils/format-tool-response';
import { executeCliCommand } from '@/utils/execute-cli-command';

export async function handleMittwaldCronjobList(
  projectId?: string,
  output: string = 'json',
  extended?: boolean,
  noHeader?: boolean,
  noTruncate?: boolean,
  noRelativeDates?: boolean,
  csvSeparator: string = ','
): Promise<ToolResponse> {
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

    return {
      toolResult: result,
    };
  } catch (error) {
    return {
      toolResult: `Error listing cron jobs: ${error instanceof Error ? error.message : String(error)}`,
      isError: true,
    };
  }
}