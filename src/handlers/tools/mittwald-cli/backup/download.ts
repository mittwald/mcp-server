import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import * as crypto from 'crypto';

interface MittwaldBackupDownloadArgs {
  backupId: string;
  quiet?: boolean;
  format?: 'tar' | 'zip';
  password?: string;
  generatePassword?: boolean;
  promptPassword?: boolean;
  output?: string;
  resume?: boolean;
}

export const handleBackupDownload: MittwaldToolHandler<MittwaldBackupDownloadArgs> = async (args, { mittwaldClient }) => {
  try {
    // Handle password options
    let encryptionPassword: string | undefined;
    
    if (args.promptPassword) {
      return formatToolResponse(
        "error",
        "Prompt password is not supported in MCP context. Use password or generatePassword instead."
      );
    }
    
    if (args.generatePassword) {
      encryptionPassword = crypto.randomBytes(16).toString('hex');
    } else if (args.password) {
      encryptionPassword = args.password;
    }

    // Find the project ID for this backup (similar to delete implementation)
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

    // Now request the backup download
    try {
      const downloadResponse = await mittwaldClient.backup.requestProjectBackupExport({
        projectId: foundProjectId,
        backupId: args.backupId,
        data: {
          format: args.format || 'tar',
          password: encryptionPassword
        }
      });

      if (!downloadResponse.data) {
        return formatToolResponse(
          "error",
          "Failed to request backup download: No response data received"
        );
      }

      // The response should contain download information
      const exportId = downloadResponse.data;
      
      if (args.quiet) {
        const result: any = { 
          exportId,
          backupId: args.backupId,
          format: args.format || 'tar'
        };
        
        if (args.generatePassword) {
          result.generatedPassword = encryptionPassword;
        }
        
        return formatToolResponse(
          "success",
          "Backup download requested successfully",
          result
        );
      }

      const result: any = {
        exportId,
        backupId: args.backupId,
        projectId: foundProjectId,
        format: args.format || 'tar',
        description: backupDetails?.description,
        message: `Backup download requested successfully. Export ID: ${exportId}`
      };
      
      if (args.generatePassword) {
        result.generatedPassword = encryptionPassword;
        result.passwordNote = "CAUTION: Store this password securely. It is not stored anywhere else.";
      }

      return formatToolResponse(
        "success",
        `Backup download requested successfully. Export ID: ${exportId}`,
        result
      );

    } catch (downloadError) {
      return formatToolResponse(
        "error",
        `Failed to request backup download: ${downloadError instanceof Error ? downloadError.message : String(downloadError)}`
      );
    }

  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to download backup: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};