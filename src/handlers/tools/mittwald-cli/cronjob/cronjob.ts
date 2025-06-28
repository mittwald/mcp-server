import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { formatToolResponse } from '@/utils/format-tool-response.js';
import { executeCliCommand } from '@/utils/execute-cli-command.js';

export async function handleMittwaldCronjob(
  help?: boolean
): Promise<CallToolResult> {
  try {
    const args = ['cronjob'];

    if (help !== false) {
      args.push('--help');
    }

    const result = await executeCliCommand('mw', args);

    return formatToolResponse('success', 'Cronjob help retrieved successfully', result);
  } catch (error) {
    return formatToolResponse('error', `Error managing cronjobs: ${error instanceof Error ? error.message : String(error)}`);
  }
}