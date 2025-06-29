import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';

interface MittwaldCronjobListArgs {
  projectId?: string;
  output?: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
  extended?: boolean;
  noHeader?: boolean;
  noTruncate?: boolean;
  noRelativeDates?: boolean;
  csvSeparator?: ',' | ';';
}

export const handleMittwaldCronjobList: MittwaldToolHandler<MittwaldCronjobListArgs> = async (args, { mittwaldClient }) => {
  try {
    // Get cronjobs from API
    const response = await mittwaldClient.api.cronjob.listCronjobs({
      projectId: args.projectId || undefined
    });

    if (response.status !== 200) {
      throw new Error(`API call failed with status: ${response.status}`);
    }

    const cronjobs = response.data;

    // Format the output based on requested format
    let formattedOutput;
    const outputFormat = args.output || 'json';

    switch (outputFormat) {
      case 'json':
        formattedOutput = cronjobs;
        break;
      
      case 'txt':
      case 'yaml':
      case 'csv':
      case 'tsv':
        // For other formats, return the raw data and let the client handle formatting
        formattedOutput = {
          format: outputFormat,
          data: cronjobs,
          options: {
            extended: args.extended,
            noHeader: args.noHeader,
            noTruncate: args.noTruncate,
            noRelativeDates: args.noRelativeDates,
            csvSeparator: args.csvSeparator
          }
        };
        break;
        
      default:
        formattedOutput = cronjobs;
    }

    return formatToolResponse('success', 'Retrieved cronjob list', formattedOutput);
  } catch (error) {
    return formatToolResponse('error', `Error listing cron jobs: ${error instanceof Error ? error.message : String(error)}`);
  }
};