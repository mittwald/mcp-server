import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';

interface Args {
  cronjobId: string;
  executionId: string;
  output?: 'txt' | 'json' | 'yaml';
}

export const handleCronjobExecutionGet: MittwaldToolHandler<Args> = async (args, { mittwaldClient }) => {
  try {
    const { cronjobId, executionId, output = 'txt' } = args;

    // Get the cron job execution details
    const response = await mittwaldClient.cronjob.getExecution({
      cronjobId,
      executionId
    });

    if (response.status !== 200) {
      return formatToolResponse(
        "error",
        `Failed to get cron job execution: ${response.status}`
      );
    }

    const execution = response.data;

    if (output === 'json') {
      return formatToolResponse(
        "success",
        JSON.stringify(execution, null, 2)
      );
    }

    if (output === 'yaml') {
      // Convert to YAML-like format
      const yamlOutput = Object.entries(execution)
        .map(([key, value]) => `${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`)
        .join('\n');
      
      return formatToolResponse(
        "success",
        yamlOutput
      );
    }

    // Default txt format
    return formatToolResponse(
      "success",
      `Cron job execution details retrieved`,
      {
        cronjobId,
        executionId,
        status: execution.status,
        createdAt: execution.createdAt,
        finishedAt: execution.finishedAt,
        duration: execution.durationInMilliseconds ? `${execution.durationInMilliseconds}ms` : 'N/A',
        logPath: (execution as any).logPath,
        abortedBy: execution.abortedBy
      }
    );
  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to get cron job execution: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};