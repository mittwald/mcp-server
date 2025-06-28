import type { ToolResponse } from '@/utils/format-tool-response';
import { executeCliCommand } from '@/utils/execute-cli-command';

export async function handleMittwaldCronjobGet(
  cronjobId: string,
  output: string = 'json'
): Promise<ToolResponse> {
  try {
    const args = [
      'cronjob',
      'get',
      cronjobId,
      '-o',
      output
    ];

    const result = await executeCliCommand('mw', args);

    return {
      toolResult: result,
    };
  } catch (error) {
    return {
      toolResult: `Error getting cron job details: ${error instanceof Error ? error.message : String(error)}`,
      isError: true,
    };
  }
}