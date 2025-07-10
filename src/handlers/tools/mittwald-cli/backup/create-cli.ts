import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { executeCli, parseQuietOutput } from '../../../../utils/cli-wrapper.js';

interface MittwaldBackupCreateCliArgs {
  projectId?: string;
  expires: string;
  description?: string;
  quiet?: boolean;
  wait?: boolean;
  waitTimeout?: string;
}

export const handleBackupCreateCli: MittwaldToolHandler<MittwaldBackupCreateCliArgs> = async (args) => {
  try {
    // Build CLI command arguments
    const cliArgs: string[] = ['backup', 'create'];
    
    // Required flags
    cliArgs.push('--expires', args.expires);
    
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
    
    if (args.wait) {
      cliArgs.push('--wait');
    }
    
    if (args.waitTimeout) {
      cliArgs.push('--wait-timeout', args.waitTimeout);
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
      
      if (errorMessage.includes('invalid') && errorMessage.includes('expires')) {
        return formatToolResponse(
          "error",
          `Invalid expires format. Expected format like '30d', '1y', '30m'. Error: ${errorMessage}`
        );
      }
      
      return formatToolResponse(
        "error",
        `Failed to create backup: ${errorMessage}`
      );
    }
    
    // Handle quiet output (returns just the ID)
    if (args.quiet) {
      try {
        const backupId = parseQuietOutput(result.stdout);
        if (backupId) {
          return formatToolResponse(
            "success",
            `Backup created successfully with ID: ${backupId}`,
            {
              id: backupId,
              projectId: args.projectId,
              expires: args.expires,
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
      "Backup creation initiated",
      {
        projectId: args.projectId,
        expires: args.expires,
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