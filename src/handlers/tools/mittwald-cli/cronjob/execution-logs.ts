import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';

interface Args {
  cronjobId: string;
  executionId: string;
  output?: 'txt' | 'json' | 'yaml';
  noPager?: boolean;
}

export const handleCronjobExecutionLogs: MittwaldToolHandler<Args> = async (args, { mittwaldClient }) => {
  try {
    const { cronjobId, executionId, output = 'txt', noPager = false } = args;

    // Get the cron job execution details first to get the log path
    const execution = await mittwaldClient.cronjob.getCronjobExecution({
      cronjobId,
      executionId
    });

    // Get the logs for the execution
    const logs = await mittwaldClient.cronjob.getCronjobExecutionLogs({
      cronjobId,
      executionId
    });

    if (output === 'json') {
      return formatToolResponse(
        "success",
        JSON.stringify({
          cronjobId,
          executionId,
          logPath: execution.logPath,
          logs: logs
        }, null, 2)
      );
    }

    if (output === 'yaml') {
      // Convert to YAML-like format
      const yamlOutput = [
        `cronjobId: ${cronjobId}`,
        `executionId: ${executionId}`,
        `logPath: ${execution.logPath}`,
        `logs: |`,
        ...logs.split('\n').map(line => `  ${line}`)
      ].join('\n');
      
      return formatToolResponse(
        "success",
        yamlOutput
      );
    }

    // Default txt format - return the raw logs
    return formatToolResponse(
      "success",
      logs || "No logs available for this execution",
      {
        cronjobId,
        executionId,
        logPath: execution.logPath,
        noPager
      }
    );
  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to get cron job execution logs: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};