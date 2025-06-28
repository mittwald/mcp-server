import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { BackupScheduleParameters } from '../../../../constants/tool/mittwald-cli/backup/backup-schedule.js';

export const handleBackupSchedule: MittwaldToolHandler<BackupScheduleParameters> = async (params, { mittwaldClient }) => {
  const { command, projectId, backupScheduleId, description, schedule, ttl, wait, waitTimeout, quiet } = params;
  
  try {
    switch (command) {
      case 'create':
        if (!projectId) {
          return formatToolResponse(
            "error",
            "Project ID is required for creating a backup schedule"
          );
        }
        
        // Build request data - API requires schedule and ttl as required fields
        const createData: { schedule: string; ttl: string; description?: string } = {
          schedule: schedule || '0 2 * * *', // Default: daily at 2 AM
          ttl: ttl || '30d'
        };
        
        if (description) {
          createData.description = description;
        }
        
        // Use the real API client to create the backup schedule
        const createResponse = await mittwaldClient.backup.createProjectBackupSchedule({
          projectId,
          data: createData
        });

        // Validate response status
        if (createResponse.status !== 201) {
          return formatToolResponse(
            "error",
            `Failed to create backup schedule. API returned status ${createResponse.status}: ${createResponse.statusText || 'Unknown error'}`
          );
        }
        
        const outputMessage = quiet 
          ? `Created backup schedule: ${createResponse.data?.id || 'unknown'}`
          : `Successfully created backup schedule for project ${projectId}`;
        
        return formatToolResponse(
          "success",
          outputMessage,
          {
            schedule: createResponse.data,
            wait: wait || false,
            waitTimeout: waitTimeout || 300000,
            quiet: quiet || false
          }
        );
        
      case 'delete':
        if (!backupScheduleId) {
          return formatToolResponse(
            "error",
            "Backup schedule ID is required for deleting a backup schedule"
          );
        }
        
        // Use the real API client to delete the backup schedule
        const deleteResponse = await mittwaldClient.backup.deleteProjectBackupSchedule({
          projectBackupScheduleId: backupScheduleId
        });

        // Validate response status
        if (deleteResponse.status !== 204) {
          return formatToolResponse(
            "error",
            `Failed to delete backup schedule. API returned status ${deleteResponse.status}: ${deleteResponse.statusText || 'Unknown error'}`
          );
        }
        
        const deleteMessage = quiet 
          ? `Deleted backup schedule: ${backupScheduleId}`
          : `Backup schedule ${backupScheduleId} has been deleted successfully`;
        
        return formatToolResponse(
          "success",
          deleteMessage,
          {
            backupScheduleId,
            quiet: quiet || false,
            deletedAt: new Date().toISOString()
          }
        );
        
      default:
        return formatToolResponse(
          "error",
          `Unknown backup schedule command: ${command}`
        );
    }
    
  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to execute backup schedule command ${command}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};