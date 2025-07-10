/**
 * @file Redis database list handler
 * @module handlers/tools/mittwald-cli/database/redis-list
 */

import { z } from 'zod';
import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { executeCli, parseJsonOutput } from '../../../../utils/cli-wrapper.js';

export const MittwaldDatabaseRedisListSchema = z.object({
  output: z.enum(['txt', 'json', 'yaml', 'csv', 'tsv']).optional().default('json'),
  projectId: z.string().optional(),
  extended: z.boolean().optional().default(false),
  csvSeparator: z.enum([',', ';']).optional().default(','),
  noHeader: z.boolean().optional().default(false),
  noRelativeDates: z.boolean().optional().default(false),
  noTruncate: z.boolean().optional().default(false),
});

export type MittwaldDatabaseRedisListInput = z.infer<typeof MittwaldDatabaseRedisListSchema>;

export const handleMittwaldDatabaseRedisList: MittwaldToolHandler<MittwaldDatabaseRedisListInput> = async (
  args
) => {
  try {
    // Build CLI command arguments
    const cliArgs: string[] = ['database', 'redis', 'list'];
    
    // Required arguments
    cliArgs.push('--output', args.output || 'json');
    
    // Optional arguments
    if (args.projectId) {
      cliArgs.push('--project-id', args.projectId);
    }
    
    if (args.extended) {
      cliArgs.push('--extended');
    }
    
    if (args.noHeader) {
      cliArgs.push('--no-header');
    }
    
    if (args.noRelativeDates) {
      cliArgs.push('--no-relative-dates');
    }
    
    if (args.noTruncate) {
      cliArgs.push('--no-truncate');
    }
    
    if (args.csvSeparator) {
      cliArgs.push('--csv-separator', args.csvSeparator);
    }
    
    // Execute CLI command
    const result = await executeCli('mw', cliArgs, {
      env: {
        // Pass through API token if available
        MITTWALD_API_TOKEN: process.env.MITTWALD_API_TOKEN || ''
      }
    });
    
    if (result.exitCode !== 0) {
      // Parse error message from stderr or stdout
      const errorMessage = result.stderr || result.stdout || 'Unknown error';
      
      // Check for common error patterns
      if (errorMessage.includes('403') || errorMessage.includes('Forbidden') || errorMessage.includes('Permission denied')) {
        return formatToolResponse(
          "error",
          `Permission denied when listing Redis databases. Check if your API token has database management permissions.\nError: ${errorMessage}`
        );
      }
      
      if (errorMessage.includes('not found') && errorMessage.includes('project')) {
        return formatToolResponse(
          "error",
          `Project not found. Please verify the project ID: ${args.projectId || 'not specified'}.\nError: ${errorMessage}`
        );
      }
      
      return formatToolResponse(
        "error",
        `Failed to list Redis databases: ${errorMessage}`
      );
    }
    
    // Parse the output based on format
    let databases: any = null;
    let responseMessage: string;
    
    if (args.output === 'json' || !args.output) {
      try {
        databases = parseJsonOutput(result.stdout);
        responseMessage = `Found ${Array.isArray(databases) ? databases.length : 'unknown number of'} Redis databases`;
      } catch (error) {
        return formatToolResponse(
          "error",
          `Failed to parse JSON output: ${error instanceof Error ? error.message : String(error)}\nRaw output: ${result.stdout}`
        );
      }
    } else {
      // For non-JSON formats, return the raw output
      databases = result.stdout;
      responseMessage = `Redis databases:`;
    }
    
    return formatToolResponse(
      "success",
      responseMessage,
      {
        databases: databases,
        output: result.stdout,
        ...(args.projectId && { projectId: args.projectId })
      }
    );
    
  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};