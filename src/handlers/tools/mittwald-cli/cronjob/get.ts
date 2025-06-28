import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { formatToolResponse } from '@/utils/format-tool-response.js';
import { executeCliCommand } from '@/utils/execute-cli-command.js';

export async function handleMittwaldCronjobGet(
  cronjobId: string,
  output: string = 'json'
): Promise<CallToolResult> {
  try {
    const args = [
      'cronjob',
      'get',
      cronjobId,
      '-o',
      output
    ];

    const result = await executeCliCommand('mw', args);

    return formatToolResponse('success', 'Retrieved cronjob details', result);
  } catch (error) {
    return formatToolResponse(
      'error', 
      `Error getting cron job details: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}