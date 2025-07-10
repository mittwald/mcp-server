import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { executeCli, parseQuietOutput } from '../../../../utils/cli-wrapper.js';

interface MittwaldBackupScheduleCreateCliArgs {
  projectId?: string;
  schedule: string;
  ttl: string;
  description?: string;
  quiet?: boolean;
}

export const handleBackupScheduleCreateCli: MittwaldToolHandler<MittwaldBackupScheduleCreateCliArgs> = async (args) => {
  try {
    // Build CLI command arguments
    const cliArgs: string[] = ['backup', 'schedule', 'create'];
    
    // Required flags
    cliArgs.push('--schedule', args.schedule);
    cliArgs.push('--ttl', args.ttl);
    
    // Optional flags
    if (args.projectId) {
      cliArgs.push('--project-id', args.projectId);
    }
    
    if (args.description) {
      cliArgs.push('--description', args.description);
    }
    
    if (args.quiet) {
      cliArgs.push('--quiet');
    }
    
    // Execute CLI command
    const result = await executeCli('mw', cliArgs, {
      env: {
        MITTWALD_API_TOKEN: process.env.MITTWALD_API_TOKEN || ''
      }
    });
    
    if (result.exitCode !== 0) {
      const errorMessage = result.stderr || result.stdout || 'Unknown error';
      
      if (errorMessage.includes('not found') && errorMessage.includes('project')) {
        return formatToolResponse(
          "error",
          `Project not found. Please verify the project ID: ${args.projectId || 'not specified'}.\nError: ${errorMessage}`
        );
      }
      
      if (errorMessage.includes('invalid') && errorMessage.includes('schedule')) {
        return formatToolResponse(
          "error",
          `Invalid schedule format. Expected cron expression. Error: ${errorMessage}`
        );
      }
      
      if (errorMessage.includes('invalid') && errorMessage.includes('ttl')) {
        return formatToolResponse(
          "error",
          `Invalid TTL format. Expected format like '7d' (7-400 days). Error: ${errorMessage}`
        );
      }
      
      return formatToolResponse(
        "error",
        `Failed to create backup schedule: ${errorMessage}`
      );
    }
    
    // Handle quiet output (returns just the ID)
    if (args.quiet) {
      try {
        const scheduleId = parseQuietOutput(result.stdout);
        if (scheduleId) {
          return formatToolResponse(
            "success",
            `Backup schedule created successfully with ID: ${scheduleId}`,
            {
              id: scheduleId,
              projectId: args.projectId,
              schedule: args.schedule,
              ttl: args.ttl,
              description: args.description
            }
          );
        }
      } catch (parseError) {
        // Fall through to regular parsing
      }
    }
    
    // For non-quiet output, return the full output
    return formatToolResponse(
      "success",
      "Backup schedule created successfully",
      {
        projectId: args.projectId,
        schedule: args.schedule,
        ttl: args.ttl,
        description: args.description,
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