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

    // Get the cron job execution details first
    const executionResponse = await mittwaldClient.cronjob.getExecution({
      cronjobId,
      executionId
    });
    
    const execution = executionResponse.data;
    const logPath = (execution as any).logPath || null;

    // Note: The Mittwald API doesn't have a direct getExecutionLogs method
    // We'll need to use the execution data to get the log information
    let logs = '';
    
    // Check if the execution has completed and has log data
    if ((execution as any).status === 'completed' && logPath) {
      logs = `Log file path: ${logPath}\nUse the file system or SSH access to view the full logs.`;
    } else if ((execution as any).status === 'running') {
      logs = 'Execution is still running. Logs will be available after completion.';
    } else {
      logs = 'No logs available for this execution.';
    }

    if (output === 'json') {
      return formatToolResponse(
        "success",
        JSON.stringify({
          cronjobId,
          executionId,
          logPath: logPath,
          logs: logs
        }, null, 2)
      );
    }

    if (output === 'yaml') {
      // Convert to YAML-like format
      const yamlOutput = [
        `cronjobId: ${cronjobId}`,
        `executionId: ${executionId}`,
        `logPath: ${logPath || 'N/A'}`,
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