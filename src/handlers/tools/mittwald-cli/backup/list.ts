import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';

interface MittwaldBackupListArgs {
  projectId?: string;
  output: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
  extended?: boolean;
  noHeader?: boolean;
  noTruncate?: boolean;
  noRelativeDates?: boolean;
  csvSeparator?: ',' | ';';
}

export const handleBackupList: MittwaldToolHandler<MittwaldBackupListArgs> = async (args, { mittwaldClient }) => {
  try {
    let backups: any[] = [];
    let targetProjectId: string | undefined = args.projectId;

    if (args.projectId) {
      // List backups for specific project
      try {
        const backupsResponse = await mittwaldClient.api.backup.listProjectBackups({
          pathParameters: { projectId: args.projectId },
        });

        if (backupsResponse.data) {
          backups = backupsResponse.data.map(backup => ({
            ...backup,
            projectId: args.projectId
          }));
        }
      } catch (error) {
        return formatToolResponse(
          "error",
          `Failed to list backups for project ${args.projectId}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    } else {
      // List backups for all accessible projects
      try {
        const projectsResponse = await mittwaldClient.api.project.listProjects({});
        
        if (projectsResponse.data) {
          for (const project of projectsResponse.data) {
            try {
              const backupsResponse = await mittwaldClient.api.backup.listProjectBackups({
                pathParameters: { projectId: project.id },
              });
              
              if (backupsResponse.data) {
                const projectBackups = backupsResponse.data.map(backup => ({
                  ...backup,
                  projectId: project.id,
                  projectName: project.description || project.shortId
                }));
                backups.push(...projectBackups);
              }
            } catch (err) {
              // Skip projects that we can't access
              continue;
            }
          }
        }
      } catch (error) {
        return formatToolResponse(
          "error",
          `Failed to list projects and backups: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    if (backups.length === 0) {
      return formatToolResponse(
        "success",
        args.projectId ? `No backups found for project ${args.projectId}` : "No backups found in any accessible project",
        []
      );
    }

    // Format the data based on output format and options
    const formatBackup = (backup: any) => {
      const baseData = {
        id: backup.id,
        projectId: backup.projectId,
        description: backup.description || 'No description',
        status: backup.status,
        createdAt: backup.createdAt,
        expiresAt: backup.expiresAt,
        size: backup.size || 'Unknown'
      };

      if (args.extended) {
        return {
          ...baseData,
          projectName: backup.projectName,
          format: backup.format || 'Unknown',
          metadata: backup.metadata || {}
        };
      }

      // For non-extended output, only include project name if listing all projects
      if (!args.projectId && backup.projectName) {
        (baseData as any).projectName = backup.projectName;
      }

      return baseData;
    };

    const formattedData = backups.map(formatBackup);

    // Handle different output formats
    if (args.output === 'json') {
      return formatToolResponse(
        "success",
        `Found ${backups.length} backup(s)`,
        formattedData
      );
    }

    if (args.output === 'yaml') {
      return formatToolResponse(
        "success",
        `Found ${backups.length} backup(s) (YAML format)`,
        formattedData
      );
    }

    if (args.output === 'csv' || args.output === 'tsv') {
      const separator = args.output === 'csv' ? (args.csvSeparator || ',') : '\t';
      
      // Create headers
      const headers = Object.keys(formattedData[0] || {});
      let csvOutput = '';
      
      if (!args.noHeader) {
        csvOutput += headers.join(separator) + '\n';
      }
      
      // Add data rows
      for (const item of formattedData) {
        const values = headers.map(header => {
          const value = item[header];
          if (typeof value === 'object') {
            return JSON.stringify(value);
          }
          return String(value || '');
        });
        csvOutput += values.join(separator) + '\n';
      }
      
      return formatToolResponse(
        "success",
        `Found ${backups.length} backup(s) (${args.output.toUpperCase()} format)`,
        {
          format: args.output,
          data: csvOutput,
          count: backups.length
        }
      );
    }

    // For txt output, format as human-readable text
    return formatToolResponse(
      "success",
      `Found ${backups.length} backup(s)`,
      formattedData
    );

  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to list backups: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};