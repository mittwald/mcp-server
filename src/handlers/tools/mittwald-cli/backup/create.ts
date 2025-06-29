import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';

interface MittwaldBackupCreateArgs {
  projectId?: string;
  expires: string;
  description?: string;
  quiet?: boolean;
  wait?: boolean;
  waitTimeout?: string;
}

export const handleBackupCreate: MittwaldToolHandler<MittwaldBackupCreateArgs> = async (args, { mittwaldClient }) => {
  try {
    // Parse the expires interval to determine if it's a valid format
    const expiresMatch = args.expires.match(/^(\d+)([mdy])$/);
    if (!expiresMatch) {
      return formatToolResponse(
        "error",
        "Invalid expires format. Use format like '30m', '30d', or '1y'"
      );
    }

    const [, amount, unit] = expiresMatch;
    let expiresAt: Date;
    const now = new Date();

    switch (unit) {
      case 'm':
        expiresAt = new Date(now.getTime() + parseInt(amount) * 60 * 1000);
        break;
      case 'd':
        expiresAt = new Date(now.getTime() + parseInt(amount) * 24 * 60 * 60 * 1000);
        break;
      case 'y':
        expiresAt = new Date(now.setFullYear(now.getFullYear() + parseInt(amount)));
        break;
      default:
        return formatToolResponse(
          "error",
          "Invalid time unit. Use 'm' for minutes, 'd' for days, or 'y' for years"
        );
    }

    // Create the backup
    const response = await mittwaldClient.backup.createProjectBackup({
      projectId: args.projectId!,
      data: {
        description: args.description,
        expirationTime: expiresAt.toISOString()
      }
    });

    if (!response.data) {
      return formatToolResponse(
        "error",
        "Failed to create backup: No response data received"
      );
    }

    const backupId = typeof response.data === 'string' ? response.data : (response.data as any)?.id || 'unknown';

    // If wait flag is set, poll for completion
    if (args.wait) {
      const timeout = args.waitTimeout ? parseTimeout(args.waitTimeout) : 600000; // Default 10 minutes
      const startTime = Date.now();

      while (Date.now() - startTime < timeout) {
        try {
          const statusResponse = await mittwaldClient.backup.getProjectBackup({
            projectBackupId: backupId
          });

          if (statusResponse.data?.status === 'ready') {
            break;
          }

          if (statusResponse.data?.status === 'failed') {
            return formatToolResponse(
              "error",
              `Backup creation failed: Unknown error`
            );
          }

          // Wait before next poll
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (pollError) {
          // Continue polling even if individual requests fail
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }

    if (args.quiet) {
      return formatToolResponse(
        "success",
        "Backup created successfully",
        { backupId }
      );
    }

    return formatToolResponse(
      "success",
      `Backup created successfully with ID: ${backupId}`,
      {
        backupId,
        projectId: args.projectId,
        description: args.description,
        expires: args.expires,
        expirationTime: expiresAt.toISOString(),
      }
    );

  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to create backup: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};

function parseTimeout(timeout: string): number {
  const match = timeout.match(/^(\d+)([msh]?)$/);
  if (!match) {
    return 600000; // Default 10 minutes
  }

  const [, amount, unit] = match;
  const value = parseInt(amount);

  switch (unit) {
    case 'ms':
    case '':
      return value;
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    default:
      return 600000;
  }
}