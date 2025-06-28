import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { formatToolResponse } from '../../../../../utils/format-tool-response.js';
import { executeCliCommand } from '../../../../../utils/execute-cli-command.js';

export async function handleMittwaldDatabaseMysqlDelete(
  databaseId: string,
  force?: boolean,
  quiet?: boolean
): Promise<CallToolResult> {
  try {
    const args = ['database', 'mysql', 'delete', databaseId];

    if (force) {
      args.push('--force');
    }

    if (quiet) {
      args.push('--quiet');
    }

    const result = await executeCliCommand('mw', args);

    return formatToolResponse('success', 'MySQL database deleted successfully', result);
  } catch (error) {
    return formatToolResponse('error', `Error deleting MySQL database: ${error instanceof Error ? error.message : String(error)}`);
  }
}