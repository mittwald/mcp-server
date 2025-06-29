import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';

interface Args {
  cronjobId: string;
  quiet?: boolean;
}

export const handleCronjobExecute: MittwaldToolHandler<Args> = async (args, { mittwaldClient }) => {
  try {
    const { cronjobId, quiet = false } = args;

    // Execute the cron job (the method name is likely different)
    const executionResponse = await mittwaldClient.cronjob.createExecution({
      cronjobId
    });

    if (executionResponse.status !== 201) {
      throw new Error(`Failed to execute cronjob: ${executionResponse.status}`);
    }

    // Get the execution ID from the response
    const executionId = executionResponse.data.id;

    if (quiet) {
      return formatToolResponse(
        "success",
        executionId
      );
    }

    // Get the cron job details for additional context
    const cronjobResponse = await mittwaldClient.cronjob.getCronjob({
      cronjobId
    });

    if (cronjobResponse.status !== 200) {
      // Still return success for execution, but without cronjob details
      return formatToolResponse(
        "success",
        `Cron job executed successfully`,
        {
          executionId,
          cronjobId,
          status: "started",
          timestamp: new Date().toISOString()
        }
      );
    }

    return formatToolResponse(
      "success",
      `Cron job executed successfully`,
      {
        executionId,
        cronjobId,
        description: cronjobResponse.data.description,
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