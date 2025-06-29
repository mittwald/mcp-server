import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';

interface MittwaldBackupGetArgs {
  backupId: string;
  output: 'txt' | 'json' | 'yaml';
}

export const handleBackupGet: MittwaldToolHandler<MittwaldBackupGetArgs> = async (args, { mittwaldClient }) => {
  try {
    // Find the project ID for this backup (similar to other backup implementations)
    let foundProjectId: string | null = null;
    let backupDetails: any = null;

    try {
      // Get all projects and search for the backup
      const projectsResponse = await mittwaldClient.api.project.listProjects({});
      
      if (projectsResponse.data) {
        for (const project of projectsResponse.data) {
          try {
            // Try to get the backup from this project
            const backupResponse = await mittwaldClient.api.backup.getProjectBackup({
              
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

    // Format the backup details based on output format
    const formatBackupDetails = (backup: any, projectId: string) => {
      const baseData = {
        id: backup.id,
        projectId: projectId,
        description: backup.description || 'No description',
        status: backup.status,
        createdAt: backup.createdAt,
        expiresAt: backup.expiresAt,
        size: backup.size || 'Unknown',
        format: backup.format || 'Unknown'
      };

      // Add additional fields if available
      if (backup.metadata) {
        (baseData as any).metadata = backup.metadata;
      }

      if (backup.tags) {
        (baseData as any).tags = backup.tags;
      }

      return baseData;
    };

    const formattedData = formatBackupDetails(backupDetails, foundProjectId);

    // Handle different output formats
    if (args.output === 'json') {
      return formatToolResponse(
        "success",
        "Backup details retrieved successfully",
        formattedData
      );
    }

    if (args.output === 'yaml') {
      // For YAML output, we'll return structured data that can be converted to YAML by the client
      return formatToolResponse(
        "success",
        "Backup details retrieved successfully (YAML format)",
        formattedData
      );
    }

    // For txt output, format as human-readable text
    const textOutput = [
      `Backup ID: ${formattedData.id}`,
      `Project ID: ${formattedData.projectId}`,
      `Description: ${formattedData.description}`,
      `Status: ${formattedData.status}`,
      `Created: ${formattedData.createdAt}`,
      `Expires: ${formattedData.expiresAt}`,
      `Size: ${formattedData.size}`,
      `Format: ${formattedData.format}`
    ];

    if ((formattedData as any).metadata) {
      textOutput.push(`Metadata: ${JSON.stringify((formattedData as any).metadata)}`);
    }

    if ((formattedData as any).tags) {
      textOutput.push(`Tags: ${(formattedData as any).tags.join(', ')}`);
    }

    return formatToolResponse(
      "success",
      textOutput.join('\n'),
      {
        format: 'txt',
        data: formattedData
      }
    );

  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to get backup details: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};