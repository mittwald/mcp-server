import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';

interface Args {
  cronjobId: string;
  quiet?: boolean;
}

export const handleCronjobExecute: MittwaldToolHandler<Args> = async (args, { mittwaldClient }) => {
  try {
    const { cronjobId, quiet = false } = args;

    // Execute the cron job
    const execution = await mittwaldClient.cronjob.api.executeCronjob({
      cronjobId
    });

    // Get the execution ID from the response
    const executionId = execution.id;

    if (quiet) {
      return formatToolResponse(
        "success",
        executionId
      );
    }

    // Get the cron job details for additional context
    const cronjob = await mittwaldClient.cronjob.api.getCronjob({
      cronjobId
    });

    return formatToolResponse(
      "success",
      `Cron job executed successfully`,
      {
        executionId,
        cronjobId,
        description: cronjob.description,
        status: "started",
        timestamp: new Date().toISOString()
      }
    );
  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to execute cron job: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};