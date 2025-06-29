import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';

interface MittwaldCronjobUpdateArgs {
  cronjobId: string;
  quiet?: boolean;
  description?: string;
  interval?: string;
  email?: string;
  url?: string;
  command?: string;
  interpreter?: 'bash' | 'php';
  enable?: boolean;
  disable?: boolean;
  timeout?: string;
}

export const handleMittwaldCronjobUpdate: MittwaldToolHandler<MittwaldCronjobUpdateArgs> = async (args, { mittwaldClient }) => {
  try {
    // Build update data
    const updateData: any = {};
    
    if (args.description !== undefined) {
      updateData.description = args.description;
    }
    
    if (args.interval !== undefined) {
      updateData.interval = args.interval;
    }
    
    if (args.email !== undefined) {
      updateData.email = args.email;
    }
    
    if (args.enable !== undefined || args.disable !== undefined) {
      updateData.active = args.enable === true || args.disable !== true;
    }
    
    if (args.timeout !== undefined) {
      // Convert timeout string to number (assuming it's in seconds)
      updateData.timeout = parseInt(args.timeout, 10);
    }
    
    // Handle destination (either URL or command)
    if (args.url !== undefined) {
      updateData.destination = {
        url: args.url
      };
    } else if (args.command !== undefined) {
      updateData.destination = {
        path: args.command,
        interpreter: args.interpreter || 'bash'
      };
    }
    
    // Call API to update cronjob
    const response = await mittwaldClient.cronjob.updateCronjob({
      cronjobId: args.cronjobId,
      data: updateData
    });
    
    if (response.status === 200 || response.status === 204) {
      return formatToolResponse('success', 'Cronjob updated successfully', response.status === 200 ? response.data : {});
    }
    
    throw new Error(`API call failed with status: ${response.status}`);
  } catch (error) {
    return formatToolResponse(
      'error', 
      `Error updating cron job: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};