import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';

interface Args {
  cronjobId: string;
  executionId: string;
  quiet?: boolean;
}

export const handleCronjobExecutionAbort: MittwaldToolHandler<Args> = async (args, { mittwaldClient }) => {
  try {
    const { cronjobId, executionId, quiet = false } = args;

    // Abort the cron job execution
    await mittwaldClient.cronjob.abortCronjobExecution({
      cronjobId,
      executionId
    });

    if (quiet) {
      return formatToolResponse(
        "success",
        "aborted"
      );
    }

    return formatToolResponse(
      "success",
      `Cron job execution aborted successfully`,
      {
        cronjobId,
        executionId,
        status: "aborted",
        timestamp: new Date().toISOString()
      }
    );
  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to abort cron job execution: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};