import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';

interface MittwaldBackupScheduleDeleteArgs {
  backupScheduleId: string;
  force?: boolean;
  quiet?: boolean;
}

export const handleBackupScheduleDelete: MittwaldToolHandler<MittwaldBackupScheduleDeleteArgs> = async (args, { mittwaldClient }) => {
  try {
    // In MCP context, force is always required since we can't ask for interactive confirmation
    if (!args.force) {
      return formatToolResponse(
        "error",
        "Force flag is required in MCP context. Set force: true to confirm backup schedule deletion."
      );
    }

    // Find the project ID for this backup schedule (similar to backup deletion)
    let foundProjectId: string | null = null;
    let scheduleDetails: any = null;

    try {
      // Get all projects and search for the backup schedule
      const projectsResponse = await mittwaldClient.api.project.listProjects({});
      
      if (projectsResponse.data) {
        for (const project of projectsResponse.data) {
          try {
            // Try to get the backup schedule from this project
            const scheduleResponse = await mittwaldClient.api.backup.getBackupSchedule({
              
                projectId: project.id,
                scheduleId: args.backupScheduleId
             
            });
            
            if (scheduleResponse.data) {
              foundProjectId = project.id;
              scheduleDetails = scheduleResponse.data;
              break;
            }
          } catch (err) {
            // Backup schedule not found in this project, continue searching
            continue;
          }
        }
      }

      if (!foundProjectId) {
        return formatToolResponse(
          "error",
          `Backup schedule with ID ${args.backupScheduleId} not found in any accessible project`
        );
      }

    } catch (searchError) {
      return formatToolResponse(
        "error",
        `Failed to search for backup schedule: ${searchError instanceof Error ? searchError.message : String(searchError)}`
      );
    }

    // Now delete the backup schedule
    try {
      await mittwaldClient.api.backup.deleteBackupSchedule({
        
          projectId: foundProjectId,
          scheduleId: args.backupScheduleId
       
      });

      if (args.quiet) {
        return formatToolResponse(
          "success",
          "Backup schedule deleted successfully",
          { backupScheduleId: args.backupScheduleId }
        );
      }

      return formatToolResponse(
        "success",
        `Backup schedule ${args.backupScheduleId} deleted successfully`,
        {
          backupScheduleId: args.backupScheduleId,
          projectId: foundProjectId,
          description: scheduleDetails?.description,
        }
      );

    } catch (deleteError) {
      return formatToolResponse(
        "error",
        `Failed to delete backup schedule: ${deleteError instanceof Error ? deleteError.message : String(deleteError)}`
      );
    }

  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to delete backup schedule: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};