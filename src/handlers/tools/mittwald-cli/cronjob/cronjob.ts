import type { ToolResponse } from '@/utils/format-tool-response';
import { executeCliCommand } from '@/utils/execute-cli-command';

export async function handleMittwaldCronjob(
  help?: boolean
): Promise<ToolResponse> {
  try {
    const args = ['cronjob'];

    if (help !== false) {
      args.push('--help');
    }

    const result = await executeCliCommand('mw', args);

    return {
      toolResult: result,
    };
  } catch (error) {
    return {
      toolResult: `Error managing cronjobs: ${error instanceof Error ? error.message : String(error)}`,
      isError: true,
    };
  }
}