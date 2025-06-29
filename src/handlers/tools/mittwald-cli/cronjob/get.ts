import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';

interface MittwaldCronjobGetArgs {
  cronjobId: string;
  output?: 'txt' | 'json' | 'yaml';
}

export const handleMittwaldCronjobGet: MittwaldToolHandler<MittwaldCronjobGetArgs> = async (args, { mittwaldClient }) => {
  try {
    // Use API client to get cronjob details
    const response = await mittwaldClient.cronjob.getCronjob({
      cronjobId: args.cronjobId
    });
    
    if (response.status === 200) {
      return formatToolResponse('success', 'Retrieved cronjob details', response.data);
    }
    
    throw new Error(`API call failed with status: ${response.status}`);
  } catch (error) {
    return formatToolResponse(
      'error', 
      `Error getting cron job details: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};