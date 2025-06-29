import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { BackupParameters } from '../../../../constants/tool/mittwald-cli/backup/backup.js';

export const handleBackup: MittwaldToolHandler<BackupParameters> = async (params, { mittwaldClient }) => {
  const { command, projectId, backupId, description, expiresAt, wait, waitTimeout, output, resume, outputFormat = 'json', extended, noHeader, noTruncate, noRelativeDates, csvSeparator } = params;
  
  try {
    switch (command) {
      case 'create':
        if (!projectId) {
          return formatToolResponse(
            "error",
            "Project ID is required for creating a backup"
          );
        }
        
        // Build request data
        const createData: Record<string, any> = {};
        if (description) {
          createData.description = description;
        }
        if (expiresAt) {
          createData.expiresAt = expiresAt;
        }
        
        // Use the real API client to create a backup
        const createResponse = await mittwaldClient.backup.createProjectBackup({
          projectId,
          data: createData
        });

        // Validate response status
        if (createResponse.status !== 201) {
          return formatToolResponse(
            "error",
            `Failed to create backup. API returned status ${createResponse.status}: ${createResponse.statusText || 'Unknown error'}`
          );
        }
        
        return formatToolResponse(
          "success",
          `Backup creation initiated for project ${projectId}`,
          {
            backup: createResponse.data,
            wait: wait || false,
            waitTimeout: waitTimeout || 300000
          }
        );
        
      case 'delete':
        return formatToolResponse(
          "error",
          "Backup deletion is not available in the current Mittwald API. Backups are automatically deleted based on their expiration date or retention policy."
        );
        
      case 'download':
        if (!backupId) {
          return formatToolResponse(
            "error",
            "Backup ID is required for downloading a backup"
          );
        }
        
        // Check if backup export exists, if not create one
        try {
          const exportResponse = await mittwaldClient.backup.createProjectBackupExport({
            projectBackupId: backupId,
            data: {
              format: output?.endsWith('.zip') ? 'zip' : 'tar'
            }
          });
          
          if (exportResponse.status !== 204) {
            return formatToolResponse(
              "error",
              `Failed to create backup export. API returned status ${exportResponse.status}`
            );
          }
          
          return formatToolResponse(
            "success",
            `Backup export created for ${backupId}. Download will be available shortly.`,
            {
              backupId,
              exportCreated: true,
              format: output?.endsWith('.zip') ? 'zip' : 'tar',
              resume: resume || false
            }
          );
        } catch (exportError) {
          return formatToolResponse(
            "error",
            `Failed to create backup export: ${exportError instanceof Error ? exportError.message : String(exportError)}`
          );
        }
        
      case 'get':
        if (!backupId) {
          return formatToolResponse(
            "error",
            "Backup ID is required for getting backup details"
          );
        }
        
        // Use the real API client to get backup details
        const getResponse = await mittwaldClient.backup.getProjectBackup({
          projectBackupId: backupId
        });

        // Validate response status
        if (getResponse.status !== 200) {
          return formatToolResponse(
            "error",
            `Failed to get backup details. API returned status ${getResponse.status}: ${getResponse.statusText || 'Unknown error'}`
          );
        }
        
        return formatToolResponse(
          "success",
          `Backup details for ${backupId}`,
          {
            backup: getResponse.data,
            extended: extended || false
          }
        );
        
      case 'list':
        if (!projectId) {
          return formatToolResponse(
            "error",
            "Project ID is required for listing backups"
          );
        }
        
        // Use the real API client to list backups
        const listResponse = await mittwaldClient.backup.listProjectBackups({
          projectId
        });

        // Validate response status
        if (listResponse.status !== 200) {
          return formatToolResponse(
            "error",
            `Failed to list backups. API returned status ${listResponse.status}: ${listResponse.statusText || 'Unknown error'}`
          );
        }
        
        const backups = listResponse.data || [];
        
        // Format output based on requested format
        let formattedOutput;
        
        switch (outputFormat) {
          case 'json':
            formattedOutput = JSON.stringify({ backups }, null, 2);
            break;
          case 'yaml':
            formattedOutput = backups.length === 0 
              ? 'backups: []'
              : `backups:\n${backups.map(b => `  - id: ${b.id}\n    description: ${b.description || 'N/A'}\n    status: ${b.status}\n    createdAt: ${b.createdAt}\n    expiresAt: ${b.expiresAt || 'N/A'}`).join('\n')}`;
            break;
          case 'csv':
          case 'tsv':
            const separator = outputFormat === 'csv' ? (csvSeparator || ',') : '\t';
            const headers = ['ID', 'Description', 'Status', 'Created At', 'Expires At'];
            const headerLine = noHeader ? '' : headers.join(separator) + '\n';
            const dataLines = backups.map(b => [
              b.id, 
              b.description || 'N/A', 
              b.status, 
              b.createdAt, 
              b.expiresAt || 'N/A'
            ].join(separator)).join('\n');
            formattedOutput = headerLine + dataLines;
            break;
          case 'txt':
          default:
            if (backups.length === 0) {
              formattedOutput = `No backups found for project ${projectId}.`;
            } else {
              formattedOutput = backups.map(b => 
                `${b.id}: ${b.description || 'No description'} (${b.status}, created: ${b.createdAt})`
              ).join('\n');
            }
            break;
        }
        
        return formatToolResponse(
          "success",
          `Found ${backups.length} backup(s) for project ${projectId}`,
          {
            backups,
            formattedOutput,
            format: outputFormat,
            extended: extended || false,
            count: backups.length
          }
        );
        
      default:
        return formatToolResponse(
          "error",
          `Unknown backup command: ${command}`
        );
    }
    
  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to execute backup command ${command}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};