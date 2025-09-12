import type { MittwaldToolHandler } from '../../../../types/mittwald/conversation.js';
import { formatToolResponse } from '../../../../utils/format-tool-response.js';
import { executeCli } from '../../../../utils/cli-wrapper.js';

interface MittwaldProjectCreateArgs {
  description: string;
  serverId?: string;
  wait?: boolean;
  waitTimeout?: string;
  updateContext?: boolean;
}

export const handleProjectCreateCli: MittwaldToolHandler<MittwaldProjectCreateArgs> = async (args, context) => {
  try {
    // Build CLI command arguments
    const cliArgs: string[] = ['project', 'create'];
    
    // Required description
    cliArgs.push('--description', args.description);
    
    // Optional flags
    if (args.serverId) {
      cliArgs.push('--server-id', args.serverId);
    }
    
    if (args.wait) {
      cliArgs.push('--wait');
    }
    
    if (args.waitTimeout) {
      cliArgs.push('--wait-timeout', args.waitTimeout);
    }
    
    if (args.updateContext) {
      cliArgs.push('--update-context');
    }
    
    // Execute CLI command
  const result = await executeCli('mw', cliArgs);
    
    if (result.exitCode !== 0) {
      const errorMessage = result.stderr || result.stdout || 'Unknown error';
      
      // Check for missing server context
      if (errorMessage.includes('No server context') || errorMessage.includes('server context required')) {
        return formatToolResponse(
          "error",
          `No server context available. You need to:\n` +
          `1. Provide a --server-id parameter, OR\n` +
          `2. Set the server context using 'mw context set --server-id <SERVER_ID>'\n` +
          `Use 'mittwald_server_list_cli' to see available servers.\nError: ${errorMessage}`
        );
      }
      
      if (errorMessage.includes('server') && errorMessage.includes('not found')) {
        return formatToolResponse(
          "error",
          `Server not found. Please verify the server ID: ${args.serverId || 'not specified'}.\nError: ${errorMessage}`
        );
      }
      
      if (errorMessage.includes('authentication') || errorMessage.includes('unauthorized')) {
        return formatToolResponse(
          "error",
          `Authentication failed. Complete OAuth sign-in and ensure the Mittwald CLI is authenticated.\nError: ${errorMessage}`
        );
      }
      
      if (errorMessage.includes('quota') || errorMessage.includes('limit')) {
        return formatToolResponse(
          "error",
          `Project creation failed due to quota or limits: ${errorMessage}`
        );
      }
      
      return formatToolResponse(
        "error",
        `Failed to create project: ${errorMessage}`
      );
    }
    
    // Handle output
    return formatToolResponse(
      "success",
      "Project created successfully",
      {
        output: result.stdout,
        description: args.description,
        serverId: args.serverId
      }
    );
    
  } catch (error) {
    return formatToolResponse(
      "error",
      `Failed to execute CLI command: ${error instanceof Error ? error.message : String(error)}`
    );
  }
};
