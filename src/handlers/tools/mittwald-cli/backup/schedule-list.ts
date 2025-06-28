import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { BackupScheduleListParameters } from '../../../../constants/tool/mittwald-cli/backup/schedule-list.js';

export const handleBackupScheduleList: MittwaldToolHandler<BackupScheduleListParameters> = async (params, { mittwaldClient }) => {
  const { projectId, output = 'json', extended, noHeader, noTruncate, noRelativeDates, csvSeparator } = params;
  
  try {
    // Resolve project ID - if not provided, would need to be resolved from context
    if (!projectId) {
      return formatToolResponse(
        "error",
        "Project ID is required. Use --project-id or set a default project in context."
      );
    }

    // Use the real API client to list backup schedules
    const response = await mittwaldClient.backup.listProjectBackupSchedules({
      projectId
    });

    // Validate response status
    if (response.status !== 200) {
      return formatToolResponse(
        "error",
        `API request failed with status ${response.status}: ${response.statusText || 'Unknown error'}`
      );
    }

    const backupSchedules = response.data || [];
    
    // Format output based on requested format
    let formattedOutput;
    
    switch (output) {
      case 'json':
        formattedOutput = JSON.stringify(backupSchedules, null, 2);
        break;
      case 'yaml':
        // Simple YAML-like format
        formattedOutput = backupSchedules.length === 0 
          ? 'backupSchedules: []'
          : backupSchedules.map(schedule => 
              `- id: ${schedule.id}\n  schedule: "${schedule.schedule}"\n  ttl: ${schedule.ttl}\n  isSystemBackup: ${schedule.isSystemBackup}\n  createdAt: ${schedule.createdAt}`
            ).join('\n');
        break;
      case 'csv':
      case 'tsv':
        const separator = output === 'csv' ? (csvSeparator || ',') : '\t';
        const header = noHeader ? '' : `ID${separator}Schedule${separator}TTL${separator}System Backup${separator}Created At\n`;
        const rows = backupSchedules.map(schedule => 
          `${schedule.id}${separator}${schedule.schedule}${separator}${schedule.ttl}${separator}${schedule.isSystemBackup}${separator}${schedule.createdAt}`
        ).join('\n');
        formattedOutput = header + rows;
        break;
      case 'txt':
      default:
        if (backupSchedules.length === 0) {
          formattedOutput = `No backup schedules found for project ${projectId}.`;
        } else {
          formattedOutput = backupSchedules.map(schedule => 
            `${schedule.id}  ${schedule.schedule}  TTL: ${schedule.ttl}  System: ${schedule.isSystemBackup ? 'Yes' : 'No'}  Created: ${schedule.createdAt}`
          ).join('\n');
        }
        break;
    }
    
    return formatToolResponse(
      "success",
      `Found ${backupSchedules.length} backup schedule(s) for project ${projectId}`,
      {
        backupSchedules,
        formattedOutput,
        format: output,
        count: backupSchedules.length
      }
    );
    
  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to list backup schedules: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};