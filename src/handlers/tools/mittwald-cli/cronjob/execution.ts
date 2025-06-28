import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';

interface Args {
  command?: 'abort' | 'get' | 'list' | 'logs';
  help?: boolean;
}

export const handleCronjobExecution: MittwaldToolHandler<Args> = async (args, context) => {
  try {
    const { command, help = false } = args;

    if (help) {
      return formatToolResponse(
        "success",
        `Cronjob execution management commands:

Available commands:
  abort  - Abort a running cron job execution
  get    - Get a cron job execution
  list   - List CronjobExecutions belonging to a Cronjob
  logs   - Get the log output of a cronjob execution

Use the specific execution commands for detailed operations:
- mittwald_cronjob_execution_abort
- mittwald_cronjob_execution_get  
- mittwald_cronjob_execution_list
- mittwald_cronjob_execution_logs`
      );
    }

    if (!command) {
      return formatToolResponse(
        "error",
        "Please specify a command or use help=true for usage information"
      );
    }

    return formatToolResponse(
      "success",
      `Use the specific execution command: mittwald_cronjob_execution_${command}`,
      {
        availableCommands: ['abort', 'get', 'list', 'logs'],
        suggestedTool: `mittwald_cronjob_execution_${command}`
      }
    );
  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to handle cronjob execution command: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};