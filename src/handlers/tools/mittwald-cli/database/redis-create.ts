/**
 * @file Redis database create handler
 * @module handlers/tools/mittwald-cli/database/redis-create
 */

import { z } from 'zod';
import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { executeCli, parseQuietOutput } from '../../../../utils/cli-wrapper.js';

export const MittwaldDatabaseRedisCreateSchema = z.object({
  description: z.string(),
  version: z.string(),
  projectId: z.string().optional(),
  quiet: z.boolean().optional().default(false),
  persistent: z.boolean().optional().default(false),
  maxMemory: z.string().optional(),
  maxMemoryPolicy: z.enum([
    'noeviction',
    'allkeys-lru',
    'allkeys-lfu',
    'volatile-lru',
    'volatile-lfu',
    'allkeys-random',
    'volatile-random',
    'volatile-ttl'
  ]).optional(),
});

export type MittwaldDatabaseRedisCreateInput = z.infer<typeof MittwaldDatabaseRedisCreateSchema>;

export const handleMittwaldDatabaseRedisCreate: MittwaldToolHandler<MittwaldDatabaseRedisCreateInput> = async (
  args
) => {
  try {
    // Build CLI command arguments
    const cliArgs: string[] = ['database', 'redis', 'create'];
    
    // Required arguments
    cliArgs.push('--description', args.description);
    cliArgs.push('--version', args.version);
    
    // Optional arguments
    if (args.projectId) {
      cliArgs.push('--project-id', args.projectId);
    }
    
    if (args.quiet) {
      cliArgs.push('--quiet');
    }
    
    if (args.persistent) {
      cliArgs.push('--persistent');
    }
    
    if (args.maxMemory) {
      cliArgs.push('--max-memory', args.maxMemory);
    }
    
    if (args.maxMemoryPolicy) {
      cliArgs.push('--max-memory-policy', args.maxMemoryPolicy);
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
          `Permission denied when creating Redis database. Check if your API token has database management permissions.\nError: ${errorMessage}`
        );
      }
      
      if (errorMessage.includes('not found') && errorMessage.includes('project')) {
        return formatToolResponse(
          "error",
          `Project not found. Please verify the project ID: ${args.projectId || 'not specified'}.\nError: ${errorMessage}`
        );
      }
      
      if (errorMessage.includes('Invalid') || errorMessage.includes('invalid')) {
        return formatToolResponse(
          "error",
          `Invalid parameter provided. Please check your input values.\nError: ${errorMessage}`
        );
      }
      
      return formatToolResponse(
        "error",
        `Failed to create Redis database: ${errorMessage}`
      );
    }
    
    // Parse the output
    let databaseId: string | null = null;
    
    if (args.quiet) {
      // In quiet mode, the CLI outputs just the ID
      databaseId = parseQuietOutput(result.stdout);
    } else {
      // In normal mode, parse the success message
      // Example: "Redis database 'description' created successfully with ID r-xxxxx"
      const idMatch = result.stdout.match(/ID\s+([a-f0-9-]+)/i);
      if (idMatch) {
        databaseId = idMatch[1];
      }
    }
    
    if (!databaseId) {
      // If we can't find the ID but the command succeeded, still report success
      return formatToolResponse(
        "success",
        args.quiet ? result.stdout : `Successfully created Redis database '${args.description}'`,
        {
          description: args.description,
          version: args.version,
          output: result.stdout
        }
      );
    }
    
    // Build result data
    const resultData = {
      id: databaseId,
      description: args.description,
      version: args.version,
      ...(args.projectId && { projectId: args.projectId }),
      ...(args.persistent && { persistent: args.persistent }),
      ...(args.maxMemory && { maxMemory: args.maxMemory }),
      ...(args.maxMemoryPolicy && { maxMemoryPolicy: args.maxMemoryPolicy })
    };
    
    return formatToolResponse(
      "success",
      args.quiet ? 
        databaseId :
        `Successfully created Redis database '${args.description}' with ID ${databaseId}`,
      resultData
    );
    
  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};