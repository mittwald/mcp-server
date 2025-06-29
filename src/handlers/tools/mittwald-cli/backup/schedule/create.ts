import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';

interface MittwaldBackupScheduleCreateArgs {
  projectId?: string;
  schedule: string;
  ttl: string;
  description?: string;
  quiet?: boolean;
}

export const handleBackupScheduleCreate: MittwaldToolHandler<MittwaldBackupScheduleCreateArgs> = async (args, { mittwaldClient }) => {
  try {
    // Validate TTL format
    const ttlMatch = args.ttl.match(/^(\d+)d$/);
    if (!ttlMatch) {
      return formatToolResponse(
        "error",
        "Invalid TTL format. Use format like '7d' for 7 days"
      );
    }

    const ttlDays = parseInt(ttlMatch[1]);
    if (ttlDays < 7 || ttlDays > 400) {
      return formatToolResponse(
        "error",
        "TTL must be between 7 and 400 days"
      );
    }

    // Validate cron schedule format (basic validation)
    const cronParts = args.schedule.trim().split(/\s+/);
    if (cronParts.length !== 5) {
      return formatToolResponse(
        "error",
        "Invalid cron schedule format. Must be a 5-part cron expression (minute hour day month weekday)"
      );
    }

    // Ensure project ID is provided
    if (!args.projectId) {
      return formatToolResponse(
        "error",
        "Project ID is required. Please provide a project ID."
      );
    }

    // Create the backup schedule
    try {
      const response = await mittwaldClient.backup.createProjectBackupSchedule({
        projectId: args.projectId,
        data: {
          schedule: args.schedule,
          description: args.description,
          retention: {
            days: ttlDays
          }
        }
      });

      if (!response.data) {
        return formatToolResponse(
          "error",
          "Failed to create backup schedule: No response data received"
        );
      }

      const scheduleId = response.data;

      if (args.quiet) {
        return formatToolResponse(
          "success",
          "Backup schedule created successfully",
          { scheduleId }
        );
      }

      return formatToolResponse(
        "success",
        `Backup schedule created successfully with ID: ${scheduleId}`,
        {
          scheduleId,
          projectId: args.projectId,
          schedule: args.schedule,
          ttl: args.ttl,
          ttlDays,
          description: args.description,
        }
      );

    } catch (createError) {
      return formatToolResponse(
        "error",
        `Failed to create backup schedule: ${createError instanceof Error ? createError.message : String(createError)}`
      );
    }

  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to create backup schedule: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};