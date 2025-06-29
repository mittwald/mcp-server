import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';

interface MittwaldBackupDeleteArgs {
  backupId: string;
  force?: boolean;
  quiet?: boolean;
}

export const handleBackupDelete: MittwaldToolHandler<MittwaldBackupDeleteArgs> = async (args, { mittwaldClient }) => {
  try {
    // In MCP context, force is always required since we can't ask for interactive confirmation
    if (!args.force) {
      return formatToolResponse(
        "error",
        "Force flag is required in MCP context. Set force: true to confirm backup deletion."
      );
    }

    // The Mittwald CLI typically resolves backup IDs to get the project ID
    // For this implementation, we'll need to search through projects to find the backup
    // This follows the CLI pattern where it searches for the backup across all accessible projects
    
    let foundProjectId: string | null = null;
    let backupDetails: any = null;

    try {
      // Get all projects and search for the backup
      const projectsResponse = await mittwaldClient.project.listProjects({});
      
      if (projectsResponse.data) {
        for (const project of projectsResponse.data) {
          try {
            // Try to get the backup from this project
            const backupResponse = await mittwaldClient.backup.getProjectBackup({
              
                projectId: project.id,
                backupId: args.backupId
             
            });
            
            if (backupResponse.data) {
              foundProjectId = project.id;
              backupDetails = backupResponse.data;
              break;
            }
          } catch (err) {
            // Backup not found in this project, continue searching
            continue;
          }
        }
      }

      if (!foundProjectId) {
        return formatToolResponse(
          "error",
          `Backup with ID ${args.backupId} not found in any accessible project`
        );
      }

    } catch (searchError) {
      return formatToolResponse(
        "error",
        `Failed to search for backup: ${searchError instanceof Error ? searchError.message : String(searchError)}`
      );
    }

    // Now delete the backup
    try {
      await mittwaldClient.backup.deleteProjectBackup({
        
          projectId: foundProjectId,
          backupId: args.backupId
       
      });

      if (args.quiet) {
        return formatToolResponse(
          "success",
          "Backup deleted successfully",
          { backupId: args.backupId }
        );
      }

      return formatToolResponse(
        "success",
        `Backup ${args.backupId} deleted successfully`,
        {
          backupId: args.backupId,
          projectId: foundProjectId,
          description: backupDetails?.description,
        }
      );

    } catch (deleteError) {
      return formatToolResponse(
        "error",
        `Failed to delete backup: ${deleteError instanceof Error ? deleteError.message : String(deleteError)}`
      );
    }

  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to delete backup: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};