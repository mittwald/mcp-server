import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';

interface Args {
  cronjobId: string;
  output?: 'txt' | 'json' | 'yaml' | 'csv' | 'tsv';
  extended?: boolean;
  noHeader?: boolean;
  noTruncate?: boolean;
  noRelativeDates?: boolean;
  csvSeparator?: ',' | ';';
}

export const handleCronjobExecutionList: MittwaldToolHandler<Args> = async (args, { mittwaldClient }) => {
  try {
    const { 
      cronjobId, 
      output = 'txt',
      extended = false,
      noHeader = false,
      noTruncate = false,
      noRelativeDates = false,
      csvSeparator = ','
    } = args;

    // List the cron job executions
    const executions = await mittwaldClient.cronjob.listCronjobExecutions({
      cronjobId
    });

    if (output === 'json') {
      return formatToolResponse(
        "success",
        JSON.stringify(executions, null, 2)
      );
    }

    if (output === 'yaml') {
      // Convert to YAML-like format
      const yamlOutput = executions.map(execution => 
        Object.entries(execution)
          .map(([key, value]) => `  ${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`)
          .join('\n')
      ).join('\n---\n');
      
      return formatToolResponse(
        "success",
        yamlOutput
      );
    }

    if (output === 'csv' || output === 'tsv') {
      const separator = output === 'csv' ? csvSeparator : '\t';
      const headers = ['executionId', 'status', 'createdAt', 'finishedAt', 'duration'];
      const headerLine = noHeader ? '' : headers.join(separator) + '\n';
      
      const dataLines = executions.map(execution => 
        [
          execution.id,
          execution.status,
          execution.createdAt,
          execution.finishedAt || '',
          execution.durationInMilliseconds ? `${execution.durationInMilliseconds}ms` : ''
        ].join(separator)
      ).join('\n');

      return formatToolResponse(
        "success",
        headerLine + dataLines
      );
    }

    // Default txt format
    const executionData = executions.map(execution => ({
      id: execution.id,
      status: execution.status,
      createdAt: execution.createdAt,
      finishedAt: execution.finishedAt,
      duration: execution.durationInMilliseconds ? `${execution.durationInMilliseconds}ms` : 'N/A',
      ...(extended && {
        logPath: execution.logPath,
        abortedBy: execution.abortedBy
      })
    }));

    return formatToolResponse(
      "success",
      `Found ${executions.length} cron job executions`,
      {
        cronjobId,
        count: executions.length,
        executions: executionData
      }
    );
  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to list cron job executions: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};