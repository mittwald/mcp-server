import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { assertStatus } from "@mittwald/api-client-commons";

interface MittwaldProjectFilesystemUsageArgs {
  projectId: string;
  human?: boolean;
}

export const handleProjectFilesystemUsage: MittwaldToolHandler<MittwaldProjectFilesystemUsageArgs> = async (args, { mittwaldClient }) => {
  try {
    // Get project details for storage quota
    const projectResponse = await mittwaldClient.project.getProject({
      projectId: args.projectId,
    });
    assertStatus(projectResponse, 200);

    // Get filesystem usage from the API
    const diskUsageResponse = await mittwaldClient.api.projectFileSystem.getDiskUsage({
      projectId: args.projectId,
    });
    assertStatus(diskUsageResponse, 200);

    const diskUsage = diskUsageResponse.data;
    const planLimitStr = projectResponse.data.spec?.storage;
    
    // Helper function to format bytes in human readable format
    const formatBytes = (bytes: number): string => {
      if (bytes === 0) return '0 B';
      
      const k = 1024;
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Parse plan limit if available
    const parsePlanLimit = (limitStr: string | undefined): number | undefined => {
      if (!limitStr) return undefined;
      const match = limitStr.match(/^(\d+)([KMGT]?)B?$/i);
      if (!match) return undefined;
      const value = parseInt(match[1]);
      const unit = match[2].toUpperCase();
      const multipliers: { [key: string]: number } = {
        '': 1,
        'K': 1024,
        'M': 1024 * 1024,
        'G': 1024 * 1024 * 1024,
        'T': 1024 * 1024 * 1024 * 1024
      };
      return value * (multipliers[unit] || 1);
    };

    const planLimitBytes = parsePlanLimit(planLimitStr);
    const usagePercentage = planLimitBytes && diskUsage.usedBytes 
      ? Math.round((diskUsage.usedBytes / planLimitBytes) * 100)
      : undefined;

    // Format the output based on human flag
    let formattedUsage;
    if (args.human) {
      formattedUsage = {
        used: diskUsage.usedBytes !== undefined ? formatBytes(diskUsage.usedBytes) : 'Not available',
        total: diskUsage.totalBytes !== undefined ? formatBytes(diskUsage.totalBytes) : 'Not available',
        provisionedStorage: planLimitStr || 'Not set',
        usagePercentage: usagePercentage !== undefined ? `${usagePercentage}%` : 'Not available'
      };
    } else {
      formattedUsage = {
        usedBytes: diskUsage.usedBytes,
        totalBytes: diskUsage.totalBytes,
        provisionedStorageBytes: planLimitBytes,
        usagePercentage: usagePercentage
      };
    }

    return formatToolResponse(
      "success",
      `Filesystem usage for project ${projectResponse.data.description}:`,
      {
        projectId: args.projectId,
        projectDescription: projectResponse.data.description,
        usage: formattedUsage,
        humanReadable: args.human || false,
        note: "Filesystem usage is not updated in real-time. It may take up to an hour for the usage to be updated."
      }
    );

  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to get filesystem usage: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};