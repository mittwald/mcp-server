/**
 * @file Redis database get handler
 * @module handlers/tools/mittwald-cli/database/redis-get
 */

import { z } from 'zod';
import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { executeCli, parseJsonOutput } from '../../../../utils/cli-wrapper.js';

export const MittwaldDatabaseRedisGetSchema = z.object({
  id: z.string(),
  output: z.enum(['txt', 'json', 'yaml']).optional().default('json'),
});

export type MittwaldDatabaseRedisGetInput = z.infer<typeof MittwaldDatabaseRedisGetSchema>;

export const handleMittwaldDatabaseRedisGet: MittwaldToolHandler<MittwaldDatabaseRedisGetInput> = async (
  args
) => {
  try {
    // Build CLI command arguments
    const cliArgs: string[] = ['database', 'redis', 'get'];
    
    // Required arguments
    cliArgs.push(args.id);
    cliArgs.push('--output', args.output || 'json');
    
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
          `Permission denied when getting Redis database. Check if your API token has database management permissions.\nError: ${errorMessage}`
        );
      }
      
      if (errorMessage.includes('not found') && (errorMessage.includes('database') || errorMessage.includes('Database'))) {
        return formatToolResponse(
          "error",
          `Redis database not found. Please verify the database ID: ${args.id}.\nError: ${errorMessage}`
        );
      }
      
      return formatToolResponse(
        "error",
        `Failed to get Redis database: ${errorMessage}`
      );
    }
    
    // Parse the output based on format
    let database: any = null;
    let responseMessage: string;
    
    if (args.output === 'json' || !args.output) {
      try {
        database = parseJsonOutput(result.stdout);
        responseMessage = `Retrieved Redis database ${args.id}`;
      } catch (error) {
        return formatToolResponse(
          "error",
          `Failed to parse JSON output: ${error instanceof Error ? error.message : String(error)}\nRaw output: ${result.stdout}`
        );
      }
    } else {
      // For non-JSON formats, return the raw output
      database = result.stdout;
      responseMessage = `Redis database ${args.id} details:`;
    }
    
    return formatToolResponse(
      "success",
      responseMessage,
      {
        id: args.id,
        database: database,
        output: result.stdout
      }
    );
    
  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};