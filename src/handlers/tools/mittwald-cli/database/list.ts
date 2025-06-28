import type { ToolResponse } from '@/utils/format-tool-response';
import { executeCliCommand } from '@/utils/execute-cli-command';

export async function handleMittwaldDatabaseList(
  projectId?: string,
  output: string = 'json',
  extended?: boolean,
  noHeader?: boolean,
  noTruncate?: boolean,
  noRelativeDates?: boolean,
  csvSeparator?: string
): Promise<ToolResponse> {
  try {
    const args = ['database', 'list'];

    if (projectId) {
      args.push('--project-id', projectId);
    }

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

    const result = await executeCliCommand('mw', args);

    return {
      toolResult: result,
    };
  } catch (error) {
    return {
      toolResult: `Error listing databases: ${error instanceof Error ? error.message : String(error)}`,
      isError: true,
    };
  }
}