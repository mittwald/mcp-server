import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { formatToolResponse } from '@/utils/format-tool-response.js';
import { executeCliCommand } from '@/utils/execute-cli-command.js';

export async function handleMittwaldCronjobUpdate(
  cronjobId: string,
  options: {
    quiet?: boolean;
    description?: string;
    interval?: string;
    email?: string;
    url?: string;
    command?: string;
    interpreter?: 'bash' | 'php';
    enable?: boolean;
    disable?: boolean;
    timeout?: string;
  }
): Promise<CallToolResult> {
  try {
    const args = [
      'cronjob',
      'update',
      cronjobId
    ];

    if (options.quiet) {
      args.push('-q');
    }

    if (options.description) {
      args.push('--description', options.description);
    }

    if (options.interval) {
      args.push('--interval', options.interval);
    }

    if (options.email) {
      args.push('--email', options.email);
    }

    if (options.url) {
      args.push('--url', options.url);
    }

    if (options.command) {
      args.push('--command', options.command);
    }

    if (options.interpreter) {
      args.push('--interpreter', options.interpreter);
    }

    if (options.enable) {
      args.push('--enable');
    }

    if (options.disable) {
      args.push('--disable');
    }

    if (options.timeout) {
      args.push('--timeout', options.timeout);
    }

    const result = await executeCliCommand('mw', args);

    return formatToolResponse('success', 'Cronjob updated successfully', result);
  } catch (error) {
    return formatToolResponse('error', `Error updating cron job: ${error instanceof Error ? error.message : String(error)}`);
  }
}