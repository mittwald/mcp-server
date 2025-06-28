import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';

interface Args {
  cronjobId: string;
  force: boolean;
  quiet?: boolean;
}

export const handleCronjobDelete: MittwaldToolHandler<Args> = async (args, { mittwaldClient }) => {
  try {
    const { cronjobId, force, quiet = false } = args;

    // Since force is required, we don't need confirmation logic here
    // The CLI would normally ask for confirmation, but in MCP context we require force=true
    
    // First, get the cron job details for reference (optional, but good for logging)
    let cronjobDetails;
    try {
      cronjobDetails = await mittwaldClient.cronjob.getCronjob({
        cronjobId
      });
    } catch (error) {
      // If we can't get the cron job, it might not exist
      return formatToolResponse(
        "error",
        `Failed to retrieve cron job with ID ${cronjobId}. It may not exist or you may not have permission to access it.`
      );
    }

    // Delete the cron job
    await mittwaldClient.cronjob.deleteCronjob({
      cronjobId
    });

    if (quiet) {
      return formatToolResponse(
        "success",
        cronjobId
      );
    }

    return formatToolResponse(
      "success",
      `Cron job deleted successfully`,
      {
        deletedCronjobId: cronjobId,
        description: cronjobDetails.description,
        interval: cronjobDetails.interval,
        wasActive: cronjobDetails.active
      }
    );
  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to delete cron job: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};