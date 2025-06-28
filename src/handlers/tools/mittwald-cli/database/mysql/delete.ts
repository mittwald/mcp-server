import { ToolResponse } from '@/types/mcp';
import { executeCliCommand } from '@/utils/execute-cli-command';

export async function handleMittwaldDatabaseMysqlDelete(
  databaseId: string,
  force?: boolean,
  quiet?: boolean
): Promise<ToolResponse> {
  try {
    const args = ['database', 'mysql', 'delete', databaseId];

    if (force) {
      args.push('--force');
    }

    if (quiet) {
      args.push('--quiet');
    }

    const result = await executeCliCommand('mw', args);

    return {
      toolResult: result,
    };
  } catch (error) {
    return {
      toolResult: `Error deleting MySQL database: ${error instanceof Error ? error.message : String(error)}`,
      isError: true,
    };
  }
}