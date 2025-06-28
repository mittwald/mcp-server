import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { BackupScheduleUpdateParameters } from '../../../../constants/tool/mittwald-cli/backup/schedule-update.js';

export const handleBackupScheduleUpdate: MittwaldToolHandler<BackupScheduleUpdateParameters> = async (params, { mittwaldClient }) => {
  const { backupScheduleId, description, schedule, ttl, quiet } = params;
  
  try {
    // Validate required parameters
    if (!backupScheduleId) {
      return formatToolResponse(
        "error",
        "Backup schedule ID is required for updating a backup schedule"
      );
    }

    // Build update data object
    const updateData: Record<string, any> = {};
    if (description !== undefined) updateData.description = description;
    if (schedule !== undefined) updateData.schedule = schedule;
    if (ttl !== undefined) updateData.ttl = ttl;
    
    // Check if there are any fields to update
    if (Object.keys(updateData).length === 0) {
      return formatToolResponse(
        "error",
        "At least one field (description, schedule, or ttl) must be provided to update"
      );
    }
    
    // Use the real API client to update the backup schedule
    const response = await mittwaldClient.backup.updateProjectBackupSchedule({
      projectBackupScheduleId: backupScheduleId,
      data: updateData
    });

    // Validate response status
    if (response.status !== 204) {
      return formatToolResponse(
        "error",
        `Failed to update backup schedule. API returned status ${response.status}: ${response.statusText || 'Unknown error'}`
      );
    }
    
    const outputMessage = quiet 
      ? `Updated backup schedule: ${backupScheduleId}`
      : `Successfully updated backup schedule ${backupScheduleId} with changes: ${JSON.stringify(updateData, null, 2)}`;
    
    return formatToolResponse(
      "success",
      outputMessage,
      {
        backupScheduleId,
        changes: updateData,
        quiet,
        updatedSchedule: response.data
      }
    );
    
  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to update backup schedule: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};